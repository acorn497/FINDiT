import { Category, FoundItemStatus } from '@findit/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { dateString } from '../common/columns';
import { Photo } from '../uploads/photo.entity';
import { User } from '../users/user.entity';

@Entity('found_items')
export class FoundItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 40 })
  title: string;

  @Column({ type: 'enum', enum: Category, enumName: 'item_category' })
  category: Category;

  /** 맡긴(보관) 장소 */
  @Column({ name: 'kept_at', type: 'varchar', length: 60 })
  keptAt: string;

  /** 주운 장소 */
  @Column({ name: 'found_place', type: 'varchar', length: 60, nullable: true })
  foundPlace: string | null;

  @Column({ name: 'found_date', type: 'date', transformer: dateString })
  foundDate: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  color: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: FoundItemStatus, enumName: 'found_item_status', default: FoundItemStatus.KEEPING })
  status: FoundItemStatus;

  @Column({ name: 'reporter_id', type: 'uuid' })
  reporterId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @OneToMany(() => Photo, (photo) => photo.foundItem)
  photos: Photo[];

  @Column({ name: 'expires_at', type: 'timestamptz', precision: 3 })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
