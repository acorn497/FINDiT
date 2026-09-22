import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoundItem } from './found-item.entity';
import { FoundItemsController } from './found-items.controller';
import { FoundItemsService } from './found-items.service';

@Module({
  imports: [TypeOrmModule.forFeature([FoundItem])],
  controllers: [FoundItemsController],
  providers: [FoundItemsService],
  exports: [FoundItemsService],
})
export class FoundItemsModule {}
