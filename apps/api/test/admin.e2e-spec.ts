import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AUTO_REJECT_REASON } from '../src/admin/admin-claims.service';
import { SEED_CLAIM_ID } from '../src/database/seeds/flow.seed';
import { SEED_FOUND } from '../src/database/seeds/found-items.seed';
import { createTestApp } from './app';
import { loginAs, resetAndSeed } from './helpers';
import { tinyPng } from './images';

describe('관리자(교사) — 승인·거절·만료·요약', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource;
  let student: string;
  let finder: string;
  let teacher: string;

  const notes = async (cookie: string) => (await request(http).get('/api/notifications').set('Cookie', cookie).expect(200)).body;

  beforeAll(async () => {
    app = await createTestApp();
    http = app.getHttpServer();
    ds = await resetAndSeed(app);
    student = await loginAs(app, 's2217@gbsw.hs.kr');
    finder = await loginAs(app, 's2103@gbsw.hs.kr');
    teacher = await loginAs(app, 'teacher@gbsw.hs.kr');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('권한', () => {
    it.each([
      ['get', '/api/admin/claims'],
      ['post', `/api/admin/claims/${SEED_CLAIM_ID}/approve`],
      ['post', `/api/admin/claims/${SEED_CLAIM_ID}/reject`],
      ['post', '/api/admin/found-items/expire'],
      ['get', '/api/admin/stats'],
    ] as const)('학생이 %s %s 에 접근하면 403', async (method, path) => {
      const res = await request(http)[method](path).set('Cookie', student).send({ reason: 'x' }).expect(403);
      expect(res.body).toEqual({ code: 'FORBIDDEN', message: '권한이 없습니다' });
    });

    it('비로그인은 401', async () => {
      await request(http).get('/api/admin/claims').expect(401);
    });
  });

  it('승인 대기 — 시드의 무선 이어폰 1건이 물건별로 묶여 보인다', async () => {
    const res = await request(http).get('/api/admin/claims').set('Cookie', teacher).expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].item).toMatchObject({ title: '무선 이어폰', status: 'CHECKING' });
    expect(res.body[0].claims).toEqual([
      expect.objectContaining({ id: SEED_CLAIM_ID, claimant: expect.objectContaining({ name: '이지우', grade: 2, classNo: 2 }) }),
    ]);
  });

  it('전체 흐름 — 로그인 → 분실 신고 → 사진 업로드 → 습득물 등록 → 목록 → 상세 → 수령 신청(CHECKING) → 교사 승인 → DONE → 신청자 알림', async () => {
    // 분실 신고 (학생)
    const lost = await request(http)
      .post('/api/lost-reports')
      .set('Cookie', student)
      .send({ category: 'STATIONERY', lostPlace: '별관 2층 미술실', lostDate: '2026-11-09', color: '노랑', description: '연필 세 자루' })
      .expect(201);

    // 사진 업로드 → 습득물 등록 (주운 학생)
    const photo = (await request(http).post('/api/uploads').set('Cookie', finder).attach('file', tinyPng(4, 4), 'p.png').expect(201)).body;
    const item = (
      await request(http)
        .post('/api/found-items')
        .set('Cookie', finder)
        .send({
          category: 'STATIONERY',
          keptAt: '본관 1층 행정실',
          foundPlace: '별관 2층 복도',
          foundDate: '2026-11-09',
          title: '노란 필통',
          color: '노랑',
          description: '연필 세 자루 들어 있음',
          photoIds: [photo.id],
        })
        .expect(201)
    ).body;

    // 분실 신고자에게 새 후보 알림, 신고는 MATCHED
    const matches = await request(http).get('/api/matches').query({ lostReportId: lost.body.id }).set('Cookie', student).expect(200);
    expect(matches.body.candidates[0].item.id).toBe(item.id);
    expect((await notes(student)).items[0]).toMatchObject({ type: 'NEW_MATCH' });

    // 목록 → 상세
    const list = await request(http).get('/api/found-items').query({ keyword: '노란 필통' }).set('Cookie', student).expect(200);
    expect(list.body.items[0]).toMatchObject({ id: item.id, thumbnail: expect.objectContaining({ id: photo.id }) });
    const detail = await request(http).get(`/api/found-items/${item.id}`).set('Cookie', student).expect(200);
    expect(detail.body).toMatchObject({ canClaim: true, status: 'KEEPING' });

    // 수령 신청 → CHECKING
    const claimed = await request(http).post(`/api/found-items/${item.id}/claims`).set('Cookie', student).expect(201);
    expect(claimed.body.status).toBe('CHECKING');

    // 교사 승인 → DONE
    const pending = await request(http).get('/api/admin/claims').set('Cookie', teacher).expect(200);
    const group = pending.body.find((g: { item: { id: string } }) => g.item.id === item.id);
    const approved = await request(http).post(`/api/admin/claims/${group.claims[0].id}/approve`).set('Cookie', teacher).expect(200);
    expect(approved.body).toMatchObject({ itemStatus: 'DONE', rejected: [] });
    const after = await request(http).get(`/api/found-items/${item.id}`).set('Cookie', student).expect(200);
    expect(after.body).toMatchObject({ status: 'DONE', canClaim: false, myClaim: { status: 'APPROVED' } });

    // 신청자에게 승인 알림
    const n = (await notes(student)).items[0];
    expect(n).toMatchObject({ type: 'CLAIM_APPROVED', title: '신청 승인', link: `/found/${item.id}`, readAt: null });
    expect(n.body).toContain('본관 1층 행정실');

    // 이미 처리된 신청은 409
    await request(http).post(`/api/admin/claims/${group.claims[0].id}/approve`).set('Cookie', teacher).expect(409);
    // DONE 물건에 새 신청 409
    await request(http).post(`/api/found-items/${item.id}/claims`).set('Cookie', finder).expect(409);
  });

  it('거절 흐름 — 사유 필수, 물건은 KEEPING 으로 돌아가고 사유가 알림에 담긴다', async () => {
    const res400 = await request(http).post(`/api/admin/claims/${SEED_CLAIM_ID}/reject`).set('Cookie', teacher).send({ reason: '  ' }).expect(400);
    expect(res400.body.message).toBe('거절 사유를 입력해 주세요');

    const res = await request(http)
      .post(`/api/admin/claims/${SEED_CLAIM_ID}/reject`)
      .set('Cookie', teacher)
      .send({ reason: '케이스 색이 다릅니다' })
      .expect(200);
    expect(res.body.itemStatus).toBe('KEEPING');
    const item = await request(http).get(`/api/found-items/${SEED_FOUND['무선 이어폰'].id}`).set('Cookie', student).expect(200);
    expect(item.body).toMatchObject({ status: 'KEEPING', myClaim: { status: 'REJECTED', rejectReason: '케이스 색이 다릅니다' } });
    const n = (await notes(student)).items[0];
    expect(n).toMatchObject({ type: 'CLAIM_REJECTED', title: '신청 거절' });
    expect(n.body).toContain('케이스 색이 다릅니다');
  });

  it('한 물건에 신청 3건 — 하나를 승인하면 나머지 2건은 REJECTED (자동 거절 알림)', async () => {
    // 주운 학생(s2103)은 자기 물건에 신청할 수 없으므로, 같은 비밀번호의 학생 계정을 하나 더 만든다
    await ds.query(
      `INSERT INTO users (email, password_hash, name, role, grade, class_no)
       SELECT 's2999@gbsw.hs.kr', password_hash, '김하늘', 'STUDENT', 2, 9 FROM users WHERE email = 's2217@gbsw.hs.kr'`,
    );
    const another = await loginAs(app, 's2999@gbsw.hs.kr');
    const umbrella = SEED_FOUND['초록 우산'].id;
    await request(http).post(`/api/found-items/${umbrella}/claims`).set('Cookie', student).expect(201);
    await request(http).post(`/api/found-items/${umbrella}/claims`).set('Cookie', another).expect(201);
    await request(http).post(`/api/found-items/${umbrella}/claims`).set('Cookie', teacher).expect(201);

    const pending = await request(http).get('/api/admin/claims').set('Cookie', teacher).expect(200);
    const group = pending.body.find((g: { item: { id: string } }) => g.item.id === umbrella);
    expect(group.claims).toHaveLength(3);

    const res = await request(http).post(`/api/admin/claims/${group.claims[1].id}/approve`).set('Cookie', teacher).expect(200);
    expect(res.body.rejected).toHaveLength(2);
    const rows: { status: string; reject_reason: string | null }[] = await ds.query(
      `SELECT status, reject_reason FROM claims WHERE found_item_id = $1 ORDER BY created_at`,
      [umbrella],
    );
    expect(rows.map((r) => r.status)).toEqual(['REJECTED', 'APPROVED', 'REJECTED']);
    expect(rows[0].reject_reason).toBe(AUTO_REJECT_REASON);
    expect((await notes(student)).items[0]).toMatchObject({ type: 'CLAIM_REJECTED' });
  });

  it('보관 중 — 30일 경과분 목록(overdue)과 일괄 만료', async () => {
    const overdue = await request(http).get('/api/found-items').query({ status: 'KEEPING', overdue: 'true', limit: 30 }).set('Cookie', teacher).expect(200);
    expect(overdue.body.total).toBeGreaterThan(0);
    for (const i of overdue.body.items) expect(Date.parse(i.expiresAt)).toBeLessThan(Date.now());

    const one = overdue.body.items[0].id;
    const picked = await request(http).post('/api/admin/found-items/expire').set('Cookie', teacher).send({ ids: [one] }).expect(200);
    expect(picked.body).toEqual({ expired: 1, ids: [one] });

    const all = await request(http).post('/api/admin/found-items/expire').set('Cookie', teacher).send({}).expect(200);
    expect(all.body.expired).toBe(overdue.body.total - 1);
    const left = await request(http).get('/api/found-items').query({ status: 'KEEPING', overdue: 'true' }).set('Cookie', teacher).expect(200);
    expect(left.body.total).toBe(0);
  });

  it('요약 — 주·월 6구간과 현재 상태별 수', async () => {
    const week = await request(http).get('/api/admin/stats').set('Cookie', teacher).expect(200);
    expect(week.body.period).toBe('week');
    expect(week.body.buckets).toHaveLength(6);
    const thisWeek = week.body.buckets[5];
    expect(thisWeek.foundItems).toBeGreaterThanOrEqual(1);
    expect(thisWeek.delivered).toBeGreaterThanOrEqual(2);
    expect(week.body.current.DONE).toBeGreaterThanOrEqual(1);

    const month = await request(http).get('/api/admin/stats').query({ period: 'month' }).set('Cookie', teacher).expect(200);
    expect(month.body.buckets.map((b: { label: string }) => b.label).at(-1)).toMatch(/^\d{4}년 \d{1,2}월$/);
    await request(http).get('/api/admin/stats').query({ period: 'year' }).set('Cookie', teacher).expect(400);
  });
});
