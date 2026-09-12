import type { Response } from 'express';
import type { DataSource } from 'typeorm';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const res = () => ({ status: jest.fn() }) as unknown as Response;

  it('DB 가 응답하면 ok/up', async () => {
    const ds = { query: jest.fn().mockResolvedValue([{ '?column?': 1 }]) } as unknown as DataSource;
    const r = res();
    await expect(new HealthController(ds).check(r)).resolves.toEqual({ status: 'ok', db: 'up' });
    expect(r.status).not.toHaveBeenCalled();
  });

  it('DB 연결이 끊기면 503 error/down', async () => {
    const ds = { query: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')) } as unknown as DataSource;
    const r = res();
    await expect(new HealthController(ds).check(r)).resolves.toEqual({ status: 'error', db: 'down' });
    expect(r.status).toHaveBeenCalledWith(503);
  });
});
