import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMatchExclusions1792494000000 implements MigrationInterface {
  name = 'CreateMatchExclusions1792494000000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "match_exclusions" (
        "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "lost_report_id" uuid NOT NULL REFERENCES "lost_reports"("id") ON DELETE CASCADE,
        "found_item_id"  uuid NOT NULL REFERENCES "found_items"("id") ON DELETE CASCADE,
        "created_at"     timestamptz(3) NOT NULL DEFAULT now(),
        "updated_at"     timestamptz(3) NOT NULL DEFAULT now(),
        CONSTRAINT "uq_match_exclusions" UNIQUE ("lost_report_id", "found_item_id")
      )`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "match_exclusions"`);
  }
}
