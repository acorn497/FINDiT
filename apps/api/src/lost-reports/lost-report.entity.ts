import { Category, LostReportStatus, TimeSlot } from '@findit/shared';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { dateString } from '../common/columns';
import { User } from '../users/user.entity';

@Entity('lost_reports')
export class LostReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: Category, enumName: 'item_category' })
  category: Category;

  @Column({ name: 'lost_place', type: 'varchar', length: 60 })
  lostPlace: string;

  @Column({ name: 'lost_date', type: 'date', transformer: dateString })
  lostDate: string;

  @Column({ name: 'time_slot', type: 'enum', enum: TimeSlot, enumName: 'time_slot', default: TimeSlot.UNKNOWN })
  timeSlot: TimeSlot;

  @Column({ type: 'varchar', length: 20 })
  color: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: LostReportStatus, enumName: 'lost_report_status', default: LostReportStatus.OPEN })
  status: LostReportStatus;

  @Column({ name: 'reporter_id', type: 'uuid' })
  reporterId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
