import { Module } from '@nestjs/common';
import { RentDuesService } from './rent-dues.service';
import { RentDuesController } from './rent-dues.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RentDuesController],
  providers: [RentDuesService],
  exports: [RentDuesService],
})
export class RentDuesModule {}
