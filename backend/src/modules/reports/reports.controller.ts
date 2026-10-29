import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ReportsService, MonthlyReport, AnnualReport } from './reports.service';
import { MonthlyReportDto, AnnualReportDto } from './dto/report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../../common/guards/owner-guard';
import { RequestWithOwnerFilter } from '../../common/types/express.d';

@Controller('reports')
@UseGuards(JwtAuthGuard, OwnerGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly')
  getMonthly(@Query() query: MonthlyReportDto, @Req() request: RequestWithOwnerFilter): Promise<MonthlyReport> {
    return this.reportsService.getMonthlyReport(query, request);
  }

  @Get('annual')
  getAnnual(@Query() query: AnnualReportDto, @Req() request: RequestWithOwnerFilter): Promise<AnnualReport> {
    return this.reportsService.getAnnualReport(query, request);
  }
}
