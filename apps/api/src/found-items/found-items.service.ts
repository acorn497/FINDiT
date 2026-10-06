import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { CATEGORY_LABEL, ErrorCode, KEEPING_DAYS, type FoundItem as FoundItemDto } from '@findit/shared';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { AppException } from '../common/app.exception';
import { Photo } from '../uploads/photo.entity';
import { UploadsService } from '../uploads/uploads.service';
import { FoundItem } from './found-item.entity';
import type { CreateFoundItemDto } from './found-items.dto';

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
  ) {}

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
