import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePhotos1791284400000 implements MigrationInterface {
  name = 'CreatePhotos1791284400000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "photos" (
        "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "found_item_id" uuid REFERENCES "found_items"("id") ON DELETE CASCADE,
        "file_path"     varchar(200) NOT NULL,
        "width"         int NOT NULL,
        "height"        int NOT NULL,
        "bytes"         int NOT NULL,
        "sort_order"    int NOT NULL DEFAULT 0,
        "created_at"    timestamptz(3) NOT NULL DEFAULT now(),
        "updated_at"    timestamptz(3) NOT NULL DEFAULT now()
      )`);
    await q.query(`CREATE INDEX "idx_photos_found_item" ON "photos" ("found_item_id", "sort_order")`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "photos"`);
  }
}
