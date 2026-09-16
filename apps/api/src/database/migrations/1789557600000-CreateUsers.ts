import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1789557600000 implements MigrationInterface {
  name = 'CreateUsers1789557600000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    await q.query(`CREATE TYPE "user_role" AS ENUM ('STUDENT', 'TEACHER')`);
    await q.query(`
      CREATE TABLE "users" (
        "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email"         varchar(120) NOT NULL UNIQUE,
        "password_hash" varchar(100) NOT NULL,
        "name"          varchar(40)  NOT NULL,
        "role"          "user_role"  NOT NULL DEFAULT 'STUDENT',
        "grade"         int,
        "class_no"      int,
        "created_at"    timestamptz(3) NOT NULL DEFAULT now(),
        "updated_at"    timestamptz(3) NOT NULL DEFAULT now()
      )`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "users"`);
    await q.query(`DROP TYPE "user_role"`);
  }
}
