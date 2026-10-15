import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Claim } from './claim.entity';
import { ClaimsService } from './claims.service';

@Module({
  imports: [TypeOrmModule.forFeature([Claim])],
  providers: [ClaimsService],
  exports: [ClaimsService],
})
export class ClaimsModule {}
