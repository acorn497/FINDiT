import { Category, type CreateFoundItemBody } from '@findit/shared';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { IsDateString, IsNotFutureDate } from '../common/validators';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateFoundItemDto implements CreateFoundItemBody {
  @IsEnum(Category, { message: '물건 종류를 선택해 주세요' })
  category: Category;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: '맡긴 장소를 입력해 주세요' })
  @MaxLength(60, { message: '장소는 60자 이하로 입력해 주세요' })
  keptAt: string;

  @IsDateString()
  @IsNotFutureDate()
  foundDate: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(40, { message: '물건 이름은 40자 이하로 입력해 주세요' })
  title?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(60, { message: '장소는 60자 이하로 입력해 주세요' })
  foundPlace?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(20, { message: '색상은 20자 이하로 입력해 주세요' })
  color?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200, { message: '특징은 200자 이하로 입력해 주세요' })
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3, { message: '사진은 최대 3장입니다' })
  @IsUUID('4', { each: true, message: '사진 id 가 올바르지 않습니다' })
  photoIds?: string[];
}
