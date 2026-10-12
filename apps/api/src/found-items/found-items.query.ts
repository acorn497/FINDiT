import { Category, FOUND_PAGE_SIZE, FoundItemStatus } from '@findit/shared';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class FoundItemListQuery {
  @IsOptional()
  @IsEnum(Category, { message: '물건 종류 값이 올바르지 않습니다' })
  category?: Category;

  @IsOptional()
  @IsEnum(FoundItemStatus, { message: '상태 값이 올바르지 않습니다' })
  status?: FoundItemStatus;

  /** 물건 이름·특징 검색어 */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(40)
  keyword?: string;

  /** 맡긴 장소·주운 곳 검색어 */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(60)
  place?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit 은 정수여야 합니다' })
  @Min(1)
  @Max(30)
  limit: number = FOUND_PAGE_SIZE;

  @IsOptional()
  @IsString()
  cursor?: string;
}
