import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { SEED_LOST } from '../src/database/seeds/flow.seed';
import { SEED_FOUND } from '../src/database/seeds/found-items.seed';
import { createTestApp } from './app';
import { loginAs, resetAndSeed } from './helpers';

describe('[이 후보 아님] 제외 · 신고 상태', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let student: string;
  const wallet = SEED_FOUND['갈색 반지갑'].id;
  const report = SEED_LOST.wallet.id;

  const candidates = async () =>
    (await request(http).get('/api/matches').query({ lostReportId: report }).set('Cookie', student).expect(200)).body;

  beforeAll(async () => {
    app = await createTestApp();
    http = app.getHttpServer();
    await resetAndSeed(app);
    student = await loginAs(app, 's2217@gbsw.hs.kr');
  });

  afterAll(async () => {
    await app.close();
  });

  it('후보에는 사진이 전부 붙어 있다', async () => {
    const body = await candidates();
    const first = body.candidates.find((c: { item: { id: string } }) => c.item.id === wallet);
    expect(first.item.photos).toHaveLength(2);
  });

  it('제외하면 목록에서 빠지고 다시 뜨지 않는다 (같은 요청을 다시 보내도 그대로)', async () => {
    const before = (await candidates()).candidates.length;
    await request(http).post('/api/matches/exclusions').set('Cookie', student).send({ lostReportId: report, foundItemId: wallet }).expect(201, {
      excluded: true,
    });
    await request(http).post('/api/matches/exclusions').set('Cookie', student).send({ lostReportId: report, foundItemId: wallet }).expect(201);
    const after = await candidates();
    expect(after.candidates).toHaveLength(before - 1);
    expect(after.candidates.map((c: { item: { id: string } }) => c.item.id)).not.toContain(wallet);
  });

  it('후보를 모두 제외하면 신고가 OPEN(찾는 중)으로 돌아간다', async () => {
    for (const c of (await candidates()).candidates) {
      await request(http).post('/api/matches/exclusions').set('Cookie', student).send({ lostReportId: report, foundItemId: c.item.id }).expect(201);
    }
    const body = await candidates();
    expect(body.candidates).toHaveLength(0);
    expect(body.lostReport.status).toBe('OPEN');
  });

  it('새 습득물이 등록되면 같은 종류 신고가 다시 MATCHED', async () => {
    const finder = await loginAs(app, 's2103@gbsw.hs.kr');
    await request(http)
      .post('/api/found-items')
      .set('Cookie', finder)
      .send({ category: 'WALLET_CARD', keptAt: '본관 1층 행정실', foundPlace: '본관 3층 화장실 앞', foundDate: '2026-10-17', title: '갈색 지갑', color: '갈색' })
      .expect(201);
    const body = await candidates();
    expect(body.lostReport.status).toBe('MATCHED');
    expect(body.candidates[0].item.title).toBe('갈색 지갑');
  });

  it('남의 신고·없는 습득물·잘못된 값', async () => {
    const other = await loginAs(app, 's2103@gbsw.hs.kr');
    await request(http).post('/api/matches/exclusions').set('Cookie', other).send({ lostReportId: report, foundItemId: wallet }).expect(403);
    await request(http)
      .post('/api/matches/exclusions')
      .set('Cookie', student)
      .send({ lostReportId: report, foundItemId: '00000000-0000-4000-8001-999999999999' })
      .expect(404);
    const bad = await request(http).post('/api/matches/exclusions').set('Cookie', student).send({ lostReportId: 'x', foundItemId: wallet }).expect(400);
    expect(bad.body.message).toBe('분실 신고 id 가 올바르지 않습니다');
  });

  it('수령 신청으로 물건이 KEEPING 이 아니게 되면 후보에서 빠진다', async () => {
    const umbrellaReport = await request(http)
      .post('/api/lost-reports')
      .set('Cookie', student)
      .send({ category: 'ETC', lostPlace: '현관', lostDate: '2026-10-16', color: '초록', description: '장우산' })
      .expect(201);
    expect(umbrellaReport.body.status).toBe('MATCHED');
    const umbrella = SEED_FOUND['초록 우산'].id;
    const teacher = await loginAs(app, 'teacher@gbsw.hs.kr');
    await request(http).post(`/api/found-items/${umbrella}/claims`).set('Cookie', teacher).expect(201);
    const body = (await request(http).get('/api/matches').query({ lostReportId: umbrellaReport.body.id }).set('Cookie', student).expect(200)).body;
    expect(body.candidates.map((c: { item: { id: string } }) => c.item.id)).not.toContain(umbrella);
  });
});
