import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorCode, LostReportStatus, TimeSlot, type LostReport as LostReportDto } from '@findit/shared';
import { Repository } from 'typeorm';
import { AppException } from '../common/app.exception';
import { AppEvents } from '../common/events';
import { LostReport } from './lost-report.entity';
import type { CreateLostReportDto, UpdateLostReportDto } from './lost-reports.dto';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class LostReportsService {
  constructor(
    @InjectRepository(LostReport) private readonly reports: Repository<LostReport>,
    private readonly events: AppEvents,
  ) {}

  async create(userId: string, dto: CreateLostReportDto) {
    const saved = await this.reports.save(
      this.reports.create({
        category: dto.category,
        lostPlace: dto.lostPlace,
        lostDate: dto.lostDate,
        timeSlot: dto.timeSlot ?? TimeSlot.UNKNOWN,
        color: dto.color,
        description: dto.description || null,
        reporterId: userId,
      }),
    );
    // 후보가 있으면 바로 '후보 있음'(MATCHED)이 된다
    await this.events.emit('lost-report.saved', { id: saved.id });
    return LostReportsService.toDto(await this.reports.findOneByOrFail({ id: saved.id }));
  }

  /** 본인 신고만 — 없으면 404, 남의 것이면 403 */
  async own(id: string, userId: string) {
    if (!UUID_RE.test(id)) throw new AppException(404, ErrorCode.NOT_FOUND, '분실 신고를 찾을 수 없습니다');
    const report = await this.reports.findOne({ where: { id } });
    if (!report) throw new AppException(404, ErrorCode.NOT_FOUND, '분실 신고를 찾을 수 없습니다');
    if (report.reporterId !== userId) throw new AppException(403, ErrorCode.FORBIDDEN, '내 신고만 볼 수 있고 고칠 수 있습니다');
    return report;
  }

  async get(id: string, userId: string) {
    return LostReportsService.toDto(await this.own(id, userId));
  }

  /** 수정 — 마감한 신고는 고칠 수 없다 */
  async update(id: string, userId: string, dto: UpdateLostReportDto) {
    const report = await this.own(id, userId);
    if (report.status === LostReportStatus.CLOSED) {
      throw new AppException(409, ErrorCode.CONFLICT, '찾음 처리(마감)한 신고는 수정할 수 없습니다');
    }
    if (dto.category !== undefined) report.category = dto.category;
    if (dto.lostPlace !== undefined) report.lostPlace = dto.lostPlace;
    if (dto.lostDate !== undefined) report.lostDate = dto.lostDate;
    if (dto.timeSlot !== undefined) report.timeSlot = dto.timeSlot;
    if (dto.color !== undefined) report.color = dto.color;
    if (dto.description !== undefined) report.description = dto.description || null;
    await this.reports.save(report);
    // 조건이 바뀌었으니 후보 유무를 다시 맞춘다
    await this.events.emit('lost-report.saved', { id });
    return LostReportsService.toDto(await this.reports.findOneByOrFail({ id }));
  }

  async remove(id: string, userId: string) {
    const report = await this.own(id, userId);
    await this.reports.delete({ id: report.id });
    return { deleted: true as const };
  }

  /** 찾음 처리(마감) — 이후 후보를 계산하지 않는다 */
  async close(id: string, userId: string) {
    const report = await this.own(id, userId);
    if (report.status !== LostReportStatus.CLOSED) {
      await this.reports.update({ id }, { status: LostReportStatus.CLOSED });
      report.status = LostReportStatus.CLOSED;
    }
    return LostReportsService.toDto(report);
  }

  static toDto(r: LostReport): LostReportDto {
    return {
      id: r.id,
      category: r.category,
      lostPlace: r.lostPlace,
      lostDate: r.lostDate,
      timeSlot: r.timeSlot,
      color: r.color,
      description: r.description,
      status: r.status,
      reporterId: r.reporterId,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
