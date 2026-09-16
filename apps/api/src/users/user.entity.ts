import { Role } from '@findit/shared';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 100, select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 40 })
  name: string;

  @Column({ type: 'enum', enum: Role, enumName: 'user_role', default: Role.STUDENT })
  role: Role;

  @Column({ type: 'int', nullable: true })
  grade: number | null;

  @Column({ name: 'class_no', type: 'int', nullable: true })
  classNo: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
