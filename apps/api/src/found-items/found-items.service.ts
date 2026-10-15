import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  CATEGORY_LABEL,
  ErrorCode,
  KEEPING_DAYS,
  type FoundItem as FoundItemDto,
  type FoundItemDetail,
  type FoundItemListResponse,
  type FoundItemSummary,
} from '@findit/shared';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { CLAIM_BLOCKED, ClaimsService, notFound } from '../claims/claims.service';
import { AppException } from '../common/app.exception';
import { decodeCursor, paginate } from '../common/cursor';
import { Photo } from '../uploads/photo.entity';
import { UploadsService } from '../uploads/uploads.service';
import { FoundItem } from './found-item.entity';
import type { CreateFoundItemDto } from './found-items.dto';
import type { FoundItemListQuery } from './found-items.query';

/** 이름을 적지 않았으면 "색상 + 종류"로 만든다 (예: 갈색 지갑·카드) */
export function defaultTitle(dto: Pick<CreateFoundItemDto, 'title' | 'color' | 'category'>) {
  if (dto.title) return dto.title;
  return [dto.color, CATEGORY_LABEL[dto.category]].filter(Boolean).join(' ');
}

@Injectable()
export class FoundItemsService {
  constructor(
    @InjectRepository(FoundItem) private readonly items: Repository<FoundItem>,
    @InjectDataSource() private readonly ds: DataSource,
    private readonly claims: ClaimsService,
  ) {}

  /** 상세 — 사진 전체, 신청 가능 여부, 내 신청 상태 */
  async detail(id: string, userId: string): Promise<FoundItemDetail> {
    if (!UUID_RE.test(id)) throw notFound();
    const item = await this.items.findOne({ where: { id }, relations: { photos: true } });
    if (!item) throw notFound();
    const mine = await this.claims.latestOf(id, userId);
    const myPending = mine?.status === 'PENDING';
    const isMine = item.reporterId === userId;
    const blocked = CLAIM_BLOCKED[item.status] ?? (isMine ? '내가 등록한 물건입니다' : null);
    return {
      ...FoundItemsService.toDto(item),
      canClaim: !blocked && !myPending,
      claimBlockedReason: blocked,
      myClaim: mine
        ? { id: mine.id, status: mine.status, rejectReason: mine.rejectReason, createdAt: mine.createdAt.toISOString() }
        : null,
      isMine,
    };
  }

  async claim(id: string, userId: string) {
    if (!UUID_RE.test(id)) throw notFound();
    await this.claims.create(id, userId);
    return this.detail(id, userId);
  }

  async cancelClaim(id: string, userId: string) {
    if (!UUID_RE.test(id)) throw notFound();
    await this.claims.cancel(id, userId);
    return this.detail(id, userId);
  }

  /** 습득물을 만들고, 미리 올린 사진(photoIds)을 순서대로 연결한다. */
  async create(userId: string, dto: CreateFoundItemDto) {
    const now = Date.now();
    const photoIds = [...new Set(dto.photoIds ?? [])];
    return this.ds.transaction(async (em) => {
      const item = await em.save(
        em.create(FoundItem, {
        title: defaultTitle(dto),
        category: dto.category,
        keptAt: dto.keptAt,
        foundPlace: dto.foundPlace || null,
        foundDate: dto.foundDate,
        color: dto.color || null,
        description: dto.description || null,
          reporterId: userId,
          expiresAt: new Date(now + KEEPING_DAYS * 86_400_000),
        }),
      );

      const photos = photoIds.length
        ? await em.find(Photo, { where: { id: In(photoIds), foundItemId: IsNull() } })
        : [];
      if (photos.length !== photoIds.length) {
        throw new AppException(400, ErrorCode.VALIDATION_FAILED, '사진을 찾을 수 없습니다. 다시 올려 주세요');
      }
      for (const photo of photos) {
        photo.foundItemId = item.id;
        photo.sortOrder = photoIds.indexOf(photo.id);
      }
      item.photos = await em.save(photos);
      return FoundItemsService.toDto(item);
    });
  }

  /** 목록 — 조건 + 커서(created_at DESC, id DESC), 조건에 맞는 전체 건수 */
  async list(q: FoundItemListQuery): Promise<FoundItemListResponse> {
    const base = this.items.createQueryBuilder('f');
    if (q.category) base.andWhere('f.category = :category', { category: q.category });
    if (q.status) base.andWhere('f.status = :status', { status: q.status });
    if (q.keyword) {
      base.andWhere('(f.title ILIKE :kw OR f.description ILIKE :kw)', { kw: `%${escapeLike(q.keyword)}%` });
    }
    if (q.place) {
      base.andWhere('(f.kept_at ILIKE :place OR f.found_place ILIKE :place)', { place: `%${escapeLike(q.place)}%` });
    }

    const total = await base.clone().getCount();

    const page = base.clone();
    if (q.cursor) {
      const c = decodeCursor(q.cursor);
      page.andWhere('(f.created_at, f.id) < (:cAt, :cId)', { cAt: c.createdAt, cId: c.id });
    }
    const rows = await page
      .orderBy('f.created_at', 'DESC')
      .addOrderBy('f.id', 'DESC')
      .take(q.limit + 1)
      .getMany();

    const { items, nextCursor } = paginate(rows, q.limit);
    const thumbs = await this.thumbnails(items.map((i) => i.id));
    return { items: items.map((i) => FoundItemsService.toSummary(i, thumbs.get(i.id) ?? null)), nextCursor, total };
  }

  /** 물건별 첫 사진 */
  async thumbnails(ids: string[]) {
    const map = new Map<string, Photo>();
    if (ids.length === 0) return map;
    const photos = await this.ds
      .getRepository(Photo)
      .createQueryBuilder('p')
      .distinctOn(['p.found_item_id'])
      .where('p.found_item_id IN (:...ids)', { ids })
      .orderBy('p.found_item_id')
      .addOrderBy('p.sort_order', 'ASC')
      .getMany();
    photos.forEach((p) => map.set(p.foundItemId!, p));
    return map;
  }

  static toSummary(item: FoundItem, thumbnail: Photo | null): FoundItemSummary {
    return {
      id: item.id,
      title: item.title,
      category: item.category,
      keptAt: item.keptAt,
      foundPlace: item.foundPlace,
      foundDate: item.foundDate,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      thumbnail: thumbnail ? UploadsService.toDto(thumbnail) : null,
    };
  }

  static toDto(item: FoundItem): FoundItemDto {
    return {
      id: item.id,
      title: item.title,
      category: item.category,
      keptAt: item.keptAt,
      foundPlace: item.foundPlace,
      foundDate: item.foundDate,
      color: item.color,
      description: item.description,
      status: item.status,
      reporterId: item.reporterId,
      createdAt: item.createdAt.toISOString(),
      expiresAt: item.expiresAt.toISOString(),
      photos: [...(item.photos ?? [])].sort((a, b) => a.sortOrder - b.sortOrder).map(UploadsService.toDto),
    };
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** ILIKE 패턴의 특수 문자(%, _, \\) 를 문자 그대로 찾도록 이스케이프 */
export function escapeLike(s: string) {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}
