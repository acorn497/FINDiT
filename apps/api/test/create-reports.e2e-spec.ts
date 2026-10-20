import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { todayInSeoul } from '../src/common/dates';
import { createTestApp } from './app';
import { loginAs, resetAndSeed } from './helpers';
import { tinyPng } from './images';

const tomorrow = () => new Date(Date.parse(`${todayInSeoul()}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

describe('분실 신고 · 습득물 생성', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let cookie: string;

  beforeAll(async () => {
    app = await createTestApp();
    http = app.getHttpServer();
    await resetAndSeed(app);
    cookie = await loginAs(app, 's2217@gbsw.hs.kr');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/lost-reports', () => {
    const body = {
      category: 'WALLET_CARD',
      lostPlace: ' 본관 3층 복도 ',
      lostDate: '2026-09-21',
      timeSlot: 'LUNCH',
      color: '갈색',
      description: '모서리 긁힘',
    };

    it('로그인 없이는 401', async () => {
      await request(http).post('/api/lost-reports').send(body).expect(401);
    });

    it('만들면 앞뒤 공백을 지우고, 후보가 있으면 바로 MATCHED', async () => {
      const res = await request(http).post('/api/lost-reports').set('Cookie', cookie).send(body).expect(201);
      expect(res.body).toMatchObject({
        category: 'WALLET_CARD',
        lostPlace: '본관 3층 복도',
        lostDate: '2026-09-21',
        timeSlot: 'LUNCH',
        status: 'MATCHED',
      });
      expect(res.body.id).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('후보가 없으면 OPEN (찾는 중)', async () => {
      const res = await request(http)
        .post('/api/lost-reports')
        .set('Cookie', cookie)
        .send({ category: 'STATIONERY', lostPlace: '별관 5층 음악실', lostDate: '2026-10-30', color: '주황' })
        .expect(201);
      expect(res.body.status).toBe('OPEN');
    });

    it('시간대를 비우면 UNKNOWN', async () => {
      const { timeSlot: _omit, ...rest } = body;
      const res = await request(http).post('/api/lost-reports').set('Cookie', cookie).send(rest).expect(201);
      expect(res.body.timeSlot).toBe('UNKNOWN');
    });

    it('오늘은 통과, 내일 날짜는 400 notFuture', async () => {
      await request(http).post('/api/lost-reports').set('Cookie', cookie).send({ ...body, lostDate: todayInSeoul() }).expect(201);
      const res = await request(http).post('/api/lost-reports').set('Cookie', cookie).send({ ...body, lostDate: tomorrow() }).expect(400);
      expect(res.body).toEqual({ code: 'VALIDATION_FAILED', message: '오늘 이후의 날짜는 선택할 수 없습니다' });
    });

    it('필수값이 비면 첫 오류 하나만', async () => {
      const res = await request(http).post('/api/lost-reports').set('Cookie', cookie).send({ ...body, category: 'X', lostPlace: '' }).expect(400);
      expect(res.body.message).toBe('물건 종류를 선택해 주세요');
    });
  });

  describe('POST /api/found-items', () => {
    it('네 항목만으로 등록되고 이름은 "색상 + 종류"로 채운다', async () => {
      const res = await request(http)
        .post('/api/found-items')
        .set('Cookie', cookie)
        .send({ category: 'CLOTHING', keptAt: '본관 1층 행정실', foundDate: '2026-09-20', color: '회색', photoIds: [] })
        .expect(201);
      expect(res.body).toMatchObject({ title: '회색 의류', status: 'KEEPING', keptAt: '본관 1층 행정실', photos: [] });
      const days = (Date.parse(res.body.expiresAt) - Date.parse(res.body.createdAt)) / 86_400_000;
      expect(Math.round(days)).toBe(30);
    });

    it('사진 id 는 최대 3개', async () => {
      const ids = Array.from({ length: 4 }, (_, i) => `00000000-0000-4000-8000-00000000010${i}`);
      const res = await request(http)
        .post('/api/found-items')
        .set('Cookie', cookie)
        .send({ category: 'ETC', keptAt: '행정실', foundDate: '2026-09-20', photoIds: ids })
        .expect(400);
      expect(res.body.message).toBe('사진은 최대 3장입니다');
    });

    it('미리 올린 사진을 보낸 순서대로 연결한다', async () => {
      const up = async (w: number) =>
        (await request(http).post('/api/uploads').set('Cookie', cookie).attach('file', tinyPng(w, 1), 'p.png').expect(201)).body;
      const [a, b] = [await up(1), await up(2)];
      const res = await request(http)
        .post('/api/found-items')
        .set('Cookie', cookie)
        .send({ category: 'ELECTRONICS', keptAt: '2학년 교무실', foundDate: '2026-09-20', photoIds: [b.id, a.id] })
        .expect(201);
      expect(res.body.photos.map((p: { id: string }) => p.id)).toEqual([b.id, a.id]);
      expect(res.body.photos[0]).toMatchObject({ width: 2, height: 1, url: b.url });

      // 이미 다른 물건에 연결된 사진은 다시 쓸 수 없다
      const again = await request(http)
        .post('/api/found-items')
        .set('Cookie', cookie)
        .send({ category: 'ETC', keptAt: '행정실', foundDate: '2026-09-20', photoIds: [a.id] })
        .expect(400);
      expect(again.body.message).toBe('사진을 찾을 수 없습니다. 다시 올려 주세요');
    });

    it('맡긴 장소가 없으면 400', async () => {
      const res = await request(http)
        .post('/api/found-items')
        .set('Cookie', cookie)
        .send({ category: 'ETC', keptAt: '  ', foundDate: '2026-09-20' })
        .expect(400);
      expect(res.body.message).toBe('맡긴 장소를 입력해 주세요');
    });
  });
});
