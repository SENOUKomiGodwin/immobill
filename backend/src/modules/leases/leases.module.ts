import { Module } from '@nestjs/common';
import { LeasesService } from './leases.service';
import { LeasesController } from './leases.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { UnitsModule } from '../units/units.module';

@Module({
  imports: [PrismaModule, UnitsModule],
  controllers: [LeasesController],
  providers: [LeasesService],
  exports: [LeasesService],
})
export class LeasesModule {}
