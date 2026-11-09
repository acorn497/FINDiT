import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1794300000000 implements MigrationInterface {
  name = 'CreateNotifications1794300000000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TYPE "notification_type" AS ENUM ('NEW_MATCH', 'CLAIM_RECEIVED', 'CLAIM_APPROVED', 'CLAIM_REJECTED', 'PICKUP_GUIDE', 'EXPIRING')`,
    );
    await q.query(`
      CREATE TABLE "notifications" (
        "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"    uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "type"       "notification_type" NOT NULL,
        "title"      varchar(60) NOT NULL,
        "body"       varchar(300) NOT NULL,
        "link"       varchar(200),
        "read_at"    timestamptz(3),
        "payload"    jsonb,
        "created_at" timestamptz(3) NOT NULL DEFAULT now(),
        "updated_at" timestamptz(3) NOT NULL DEFAULT now()
      )`);
    await q.query(`CREATE INDEX "idx_notifications_user" ON "notifications" ("user_id", "created_at" DESC, "id" DESC)`);
    await q.query(`CREATE INDEX "idx_notifications_unread" ON "notifications" ("user_id") WHERE read_at IS NULL`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "notifications"`);
    await q.query(`DROP TYPE "notification_type"`);
  }
}
