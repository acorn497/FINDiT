import { ClaimStatus } from '@findit/shared';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { FoundItem } from '../found-items/found-item.entity';
import { User } from '../users/user.entity';

@Entity('claims')
export class Claim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'found_item_id', type: 'uuid' })
  foundItemId: string;

  @ManyToOne(() => FoundItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'found_item_id' })
  foundItem: FoundItem;

  @Column({ name: 'claimant_id', type: 'uuid' })
  claimantId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'claimant_id' })
  claimant: User;

  @Column({ type: 'enum', enum: ClaimStatus, enumName: 'claim_status', default: ClaimStatus.PENDING })
  status: ClaimStatus;

  @Column({ name: 'reject_reason', type: 'varchar', length: 200, nullable: true })
  rejectReason: string | null;

  @Column({ name: 'decided_by', type: 'uuid', nullable: true })
  decidedBy: string | null;

  @Column({ name: 'decided_at', type: 'timestamptz', precision: 3, nullable: true })
  decidedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
