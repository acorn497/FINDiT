import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { lostReportTitle, type Category, type MyReportItem, type MyReportsResponse, type ReportKind } from '@findit/shared';
import { DataSource } from 'typeorm';
import { decodeCursor, paginate } from '../common/cursor';
import { FoundItemsService } from '../found-items/found-items.service';
import { MatchesService } from '../matches/matches.service';
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
    private readonly matches: MatchesService,
  ) {}

  /** kind(lost|found) 와 status 로 거를 수 있다. 분실 신고에는 현재 후보 수를 붙인다. */
  async list(
    userId: string,
    opts: { cursor?: string; limit: number; kind?: ReportKind; status?: string },
  ): Promise<MyReportsResponse> {
    const params: unknown[] = [userId];
    const conds: string[] = [];
    const next = (v: unknown) => {
      params.push(v);
      return `$${params.length}`;
    };
    if (opts.status) conds.push(`t.status = ${next(opts.status)}`);
    if (opts.cursor) {
      const c = decodeCursor(opts.cursor);
      conds.push(`(t."createdAt", t.id) < (${next(c.createdAt)}, ${next(c.id)}::uuid)`);
    }
    const lost = `SELECT 'lost' AS kind, l.id, l.category, NULL AS title, l.color, l.lost_place AS place,
                         to_char(l.lost_date, 'YYYY-MM-DD') AS date, l.status::text AS status, l.created_at AS "createdAt"
                    FROM lost_reports l WHERE l.reporter_id = $1`;
    const found = `SELECT 'found' AS kind, f.id, f.category, f.title, f.color, f.kept_at AS place,
                          to_char(f.found_date, 'YYYY-MM-DD') AS date, f.status::text AS status, f.created_at AS "createdAt"
                     FROM found_items f WHERE f.reporter_id = $1`;
    const source = opts.kind === 'lost' ? lost : opts.kind === 'found' ? found : `${lost} UNION ALL ${found}`;
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const limit = next(opts.limit + 1);
    const rows: Row[] = await this.ds.query(
      `SELECT * FROM (${source}) t ${where} ORDER BY t."createdAt" DESC, t.id DESC LIMIT ${limit}`,
      params,
    );
    const { items, nextCursor } = paginate(rows, opts.limit);
    const counts = await this.matches.candidateCounts(items.filter((r) => r.kind === 'lost').map((r) => r.id));
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
        candidateCount: r.kind === 'lost' ? (counts.get(r.id) ?? 0) : null,
      })),
      nextCursor,
    };
  }
}
