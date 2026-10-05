import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { FoundItem } from '../found-items/found-item.entity';

@Entity('photos')
export class Photo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 업로드 직후에는 비어 있고, 습득물 등록 때 연결된다 */
  @Column({ name: 'found_item_id', type: 'uuid', nullable: true })
  foundItemId: string | null;

  @ManyToOne(() => FoundItem, (item) => item.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'found_item_id' })
  foundItem: FoundItem | null;

  /** 업로드 폴더 안의 파일 이름 */
  @Column({ name: 'file_path', type: 'varchar', length: 200 })
  filePath: string;

  @Column({ type: 'int' })
  width: number;

  @Column({ type: 'int' })
  height: number;

  @Column({ type: 'int' })
  bytes: number;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
