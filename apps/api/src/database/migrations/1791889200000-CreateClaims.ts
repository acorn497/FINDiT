import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClaims1791889200000 implements MigrationInterface {
  name = 'CreateClaims1791889200000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TYPE "claim_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')`);
    await q.query(`
      CREATE TABLE "claims" (
        "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "found_item_id" uuid NOT NULL REFERENCES "found_items"("id") ON DELETE CASCADE,
        "claimant_id"   uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "status"        "claim_status" NOT NULL DEFAULT 'PENDING',
        "reject_reason" varchar(200),
        "decided_by"    uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "decided_at"    timestamptz(3),
        "created_at"    timestamptz(3) NOT NULL DEFAULT now(),
        "updated_at"    timestamptz(3) NOT NULL DEFAULT now()
      )`);
    // 한 사용자가 같은 물건에 PENDING 신청을 동시에 두 건 가질 수 없다
    await q.query(`CREATE UNIQUE INDEX "uq_claims_pending" ON "claims" ("found_item_id", "claimant_id") WHERE status = 'PENDING'`);
    // 한 물건의 APPROVED 는 최대 1건
    await q.query(`CREATE UNIQUE INDEX "uq_claims_approved" ON "claims" ("found_item_id") WHERE status = 'APPROVED'`);
    await q.query(`CREATE INDEX "idx_claims_status" ON "claims" ("status", "created_at")`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "claims"`);
    await q.query(`DROP TYPE "claim_status"`);
  }
}
