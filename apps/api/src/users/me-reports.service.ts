import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { lostReportTitle, type Category, type MyReportItem, type MyReportsResponse } from '@findit/shared';
import { DataSource } from 'typeorm';
import { decodeCursor, paginate } from '../common/cursor';
import { FoundItemsService } from '../found-items/found-items.service';
import { UploadsService } from '../uploads/uploads.service';

interface Row {
  kind: 'lost' | 'found';
  id: string;
  category: Category;
  title: string | null;
  color: string | null;
  place: string;
  date: string;
  status: MyReportItem['status'];
  createdAt: Date;
}

/** 내가 올린 분실 신고 + 습득 등록을 한 목록으로 (created_at DESC, id DESC 커서) */
@Injectable()
export class MeReportsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly found: FoundItemsService,
  ) {}

  async list(userId: string, opts: { cursor?: string; limit: number }): Promise<MyReportsResponse> {
    const params: unknown[] = [userId];
    let where = '';
    if (opts.cursor) {
      const c = decodeCursor(opts.cursor);
      params.push(c.createdAt, c.id);
      where = `WHERE (t."createdAt", t.id) < ($2, $3::uuid)`;
    }
    params.push(opts.limit + 1);
    const rows: Row[] = await this.ds.query(
      `SELECT * FROM (
         SELECT 'lost' AS kind, l.id, l.category, NULL AS title, l.color, l.lost_place AS place,
                to_char(l.lost_date, 'YYYY-MM-DD') AS date, l.status::text AS status, l.created_at AS "createdAt"
           FROM lost_reports l WHERE l.reporter_id = $1
         UNION ALL
         SELECT 'found', f.id, f.category, f.title, f.color, f.kept_at,
                to_char(f.found_date, 'YYYY-MM-DD'), f.status::text, f.created_at
           FROM found_items f WHERE f.reporter_id = $1
       ) t ${where}
       ORDER BY t."createdAt" DESC, t.id DESC
       LIMIT $${params.length}`,
      params,
    );
    const { items, nextCursor } = paginate(rows, opts.limit);
    const thumbs = await this.found.thumbnails(items.filter((r) => r.kind === 'found').map((r) => r.id));
    return {
      items: items.map((r) => ({
        kind: r.kind,
        id: r.id,
        title: r.kind === 'lost' ? lostReportTitle({ color: r.color ?? '', category: r.category }) : (r.title ?? ''),
        category: r.category,
        place: r.place,
        date: r.date,
        status: r.status,
        createdAt: new Date(r.createdAt).toISOString(),
        thumbnail: r.kind === 'found' && thumbs.get(r.id) ? UploadsService.toDto(thumbs.get(r.id)!) : null,
        candidateCount: null,
      })),
      nextCursor,
    };
  }
}
