import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLostReportsAndFoundItems1790074800000 implements MigrationInterface {
  name = 'CreateLostReportsAndFoundItems1790074800000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TYPE "item_category" AS ENUM ('WALLET_CARD', 'ELECTRONICS', 'CLOTHING', 'STATIONERY', 'ETC')`);
    await q.query(`CREATE TYPE "found_item_status" AS ENUM ('KEEPING', 'CHECKING', 'DONE', 'EXPIRED')`);
    await q.query(`CREATE TYPE "lost_report_status" AS ENUM ('OPEN', 'MATCHED', 'CLOSED')`);
    await q.query(`CREATE TYPE "time_slot" AS ENUM ('BEFORE_SCHOOL', 'LUNCH', 'AFTER_SCHOOL', 'UNKNOWN')`);

    await q.query(`
      CREATE TABLE "found_items" (
        "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title"       varchar(40) NOT NULL,
        "category"    "item_category" NOT NULL,
        "kept_at"     varchar(60) NOT NULL,
        "found_place" varchar(60),
        "found_date"  date NOT NULL,
        "color"       varchar(20),
        "description" varchar(200),
        "status"      "found_item_status" NOT NULL DEFAULT 'KEEPING',
        "reporter_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "expires_at"  timestamptz(3) NOT NULL,
        "created_at"  timestamptz(3) NOT NULL DEFAULT now(),
        "updated_at"  timestamptz(3) NOT NULL DEFAULT now()
      )`);
    await q.query(`CREATE INDEX "idx_found_items_created" ON "found_items" ("created_at" DESC, "id" DESC)`);
    await q.query(`CREATE INDEX "idx_found_items_category_status" ON "found_items" ("category", "status")`);
    await q.query(`CREATE INDEX "idx_found_items_reporter" ON "found_items" ("reporter_id")`);

    await q.query(`
      CREATE TABLE "lost_reports" (
        "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "category"    "item_category" NOT NULL,
        "lost_place"  varchar(60) NOT NULL,
        "lost_date"   date NOT NULL,
        "time_slot"   "time_slot" NOT NULL DEFAULT 'UNKNOWN',
        "color"       varchar(20) NOT NULL,
        "description" varchar(200),
        "status"      "lost_report_status" NOT NULL DEFAULT 'OPEN',
        "reporter_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at"  timestamptz(3) NOT NULL DEFAULT now(),
        "updated_at"  timestamptz(3) NOT NULL DEFAULT now()
      )`);
    await q.query(`CREATE INDEX "idx_lost_reports_reporter" ON "lost_reports" ("reporter_id", "created_at" DESC)`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "lost_reports"`);
    await q.query(`DROP TABLE "found_items"`);
    await q.query(`DROP TYPE "time_slot"`);
    await q.query(`DROP TYPE "lost_report_status"`);
    await q.query(`DROP TYPE "found_item_status"`);
    await q.query(`DROP TYPE "item_category"`);
  }
}
