import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

/** [이 후보 아님] 기록 — 이후 그 분실 신고의 후보에서 다시 뜨지 않는다 */
@Entity('match_exclusions')
@Unique('uq_match_exclusions', ['lostReportId', 'foundItemId'])
export class MatchExclusion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lost_report_id', type: 'uuid' })
  lostReportId: string;

  @Column({ name: 'found_item_id', type: 'uuid' })
  foundItemId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
