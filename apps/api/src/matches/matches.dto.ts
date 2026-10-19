import { IsUUID } from 'class-validator';

export class CreateExclusionDto {
  @IsUUID('4', { message: '분실 신고 id 가 올바르지 않습니다' })
  lostReportId: string;

  @IsUUID('4', { message: '습득물 id 가 올바르지 않습니다' })
  foundItemId: string;
}
