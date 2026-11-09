import { NotificationType } from '@findit/shared';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: NotificationType, enumName: 'notification_type' })
  type: NotificationType;

  @Column({ type: 'varchar', length: 60 })
  title: string;

  @Column({ type: 'varchar', length: 300 })
  body: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  link: string | null;

  @Column({ name: 'read_at', type: 'timestamptz', precision: 3, nullable: true })
  readAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
