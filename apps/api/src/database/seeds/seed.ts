import { Logger } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { seedFlow } from './flow.seed';
import { seedFoundItems } from './found-items.seed';
import { seedNotifications } from './notifications.seed';
import { seedUsers } from './users.seed';

/**
 * 시드 데이터 — 컨테이너가 뜰 때마다 실행되며 멱등하다.
 * 고정 id 로 넣고 이미 있으면 건너뛰므로, 사용 중에 바뀐 데이터는 되돌리지 않는다.
 */
export async function runSeed(ds: DataSource) {
  const logger = new Logger('Seed');
  const users = await seedUsers(ds);
  const found = await seedFoundItems(ds);
  const flow = await seedFlow(ds);
  const notes = await seedNotifications(ds);
  logger.log(`users +${users} · found_items +${found} · lost_reports/claims +${flow} · notifications +${notes}`);
}
