import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClaimsModule } from '../claims/claims.module';
import { Photo } from '../uploads/photo.entity';
import { FoundItem } from './found-item.entity';
import { FoundItemsController } from './found-items.controller';
import { FoundItemsService } from './found-items.service';

@Module({
  imports: [TypeOrmModule.forFeature([FoundItem, Photo]), ClaimsModule],
  controllers: [FoundItemsController],
  providers: [FoundItemsService],
  exports: [FoundItemsService],
})
export class FoundItemsModule {}
