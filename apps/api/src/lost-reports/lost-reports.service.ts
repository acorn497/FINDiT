import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TimeSlot, type LostReport as LostReportDto } from '@findit/shared';
import { Repository } from 'typeorm';
import { AppEvents } from '../common/events';
import { LostReport } from './lost-report.entity';
import type { CreateLostReportDto } from './lost-reports.dto';

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
