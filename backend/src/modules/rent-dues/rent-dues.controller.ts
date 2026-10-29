import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RentDuesService } from './rent-dues.service';
import { QueryRentDueDto } from './dto/rent-due.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../../common/guards/owner-guard';
import { RequestWithOwnerFilter } from '../../common/types/express.d';

@ApiTags('RentDues')
@Controller('rent-dues')
@UseGuards(JwtAuthGuard, OwnerGuard)
@ApiBearerAuth()
export class RentDuesController {
  constructor(private readonly rentDuesService: RentDuesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les échéances' })
  @ApiResponse({ status: 200, description: 'Liste des échéances avec statut calculé' })
  findAll(@Query() query: QueryRentDueDto, @Req() request: RequestWithOwnerFilter) {
    return this.rentDuesService.findAll(query, request);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une échéance' })
  @ApiResponse({ status: 200, description: 'Échéance trouvée avec statut calculé' })
  @ApiResponse({ status: 404, description: 'Échéance non trouvée' })
  findOne(@Param('id') id: string, @Req() request: RequestWithOwnerFilter) {
    return this.rentDuesService.findOne(id, request);
  }
}
