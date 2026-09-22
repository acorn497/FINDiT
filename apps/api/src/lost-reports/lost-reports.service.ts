import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TimeSlot, type LostReport as LostReportDto } from '@findit/shared';
import { Repository } from 'typeorm';
import { LostReport } from './lost-report.entity';
import type { CreateLostReportDto } from './lost-reports.dto';

@Injectable()
export class LostReportsService {
  constructor(@InjectRepository(LostReport) private readonly reports: Repository<LostReport>) {}

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
    return LostReportsService.toDto(saved);
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
