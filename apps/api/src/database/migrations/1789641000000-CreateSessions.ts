import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessions1789641000000 implements MigrationInterface {
  name = 'CreateSessions1789641000000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "sessions" (
        "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"    uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token_hash" char(64) NOT NULL UNIQUE,
        "expires_at" timestamptz(3) NOT NULL,
        "user_agent" varchar(300),
        "created_at" timestamptz(3) NOT NULL DEFAULT now(),
        "updated_at" timestamptz(3) NOT NULL DEFAULT now()
      )`);
    await q.query(`CREATE INDEX "idx_sessions_user" ON "sessions" ("user_id")`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "sessions"`);
  }
}
