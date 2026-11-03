import { Category, TimeSlot, type CreateLostReportBody } from '@findit/shared';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsDateString, IsNotFutureDate } from '../common/validators';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateLostReportDto implements CreateLostReportBody {
  @IsEnum(Category, { message: '물건 종류를 선택해 주세요' })
  category: Category;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: '잃어버린 장소를 입력해 주세요' })
  @MaxLength(60, { message: '장소는 60자 이하로 입력해 주세요' })
  lostPlace: string;

  @IsDateString()
  @IsNotFutureDate()
  lostDate: string;

  @IsOptional()
  @IsEnum(TimeSlot, { message: '시간대 값이 올바르지 않습니다' })
  timeSlot?: TimeSlot;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: '색상을 입력해 주세요' })
  @MaxLength(20, { message: '색상은 20자 이하로 입력해 주세요' })
  color: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200, { message: '특징은 200자 이하로 입력해 주세요' })
  description?: string;
}

/** 수정 — 보낸 항목만 바꾼다 */
export class UpdateLostReportDto {
  @IsOptional()
  @IsEnum(Category, { message: '물건 종류를 선택해 주세요' })
  category?: Category;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: '잃어버린 장소를 입력해 주세요' })
  @MaxLength(60, { message: '장소는 60자 이하로 입력해 주세요' })
  lostPlace?: string;

  @IsOptional()
  @IsDateString()
  @IsNotFutureDate()
  lostDate?: string;

  @IsOptional()
  @IsEnum(TimeSlot, { message: '시간대 값이 올바르지 않습니다' })
  timeSlot?: TimeSlot;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: '색상을 입력해 주세요' })
  @MaxLength(20, { message: '색상은 20자 이하로 입력해 주세요' })
  color?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200, { message: '특징은 200자 이하로 입력해 주세요' })
  description?: string;
}
