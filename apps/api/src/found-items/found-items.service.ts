import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CATEGORY_LABEL, KEEPING_DAYS, type FoundItem as FoundItemDto } from '@findit/shared';
import { Repository } from 'typeorm';
import { FoundItem } from './found-item.entity';
import type { CreateFoundItemDto } from './found-items.dto';

/** 이름을 적지 않았으면 "색상 + 종류"로 만든다 (예: 갈색 지갑·카드) */
export function defaultTitle(dto: Pick<CreateFoundItemDto, 'title' | 'color' | 'category'>) {
  if (dto.title) return dto.title;
  return [dto.color, CATEGORY_LABEL[dto.category]].filter(Boolean).join(' ');
}

@Injectable()
export class FoundItemsService {
  constructor(@InjectRepository(FoundItem) private readonly items: Repository<FoundItem>) {}

  async create(userId: string, dto: CreateFoundItemDto) {
    const now = Date.now();
    const saved = await this.items.save(
      this.items.create({
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
    return FoundItemsService.toDto(saved);
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
      photos: [],
    };
  }
}
