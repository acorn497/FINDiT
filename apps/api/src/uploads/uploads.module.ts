import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Photo } from './photo.entity';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [TypeOrmModule.forFeature([Photo])],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService, TypeOrmModule],
})
export class UploadsModule {}
