import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LeasesService } from './leases.service';
import { CreateLeaseDto, UpdateLeaseDto, QueryLeaseDto } from './dto/lease.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../../common/guards/owner-guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestWithOwnerFilter } from '../../common/types/express.d';

@ApiTags('Leases')
@Controller('leases')
@UseGuards(JwtAuthGuard, OwnerGuard)
@ApiBearerAuth()
export class LeasesController {
  constructor(private readonly leasesService: LeasesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un bail' })
  @ApiResponse({ status: 201, description: 'Bail créé avec échéances générées' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Unité ou locataire non trouvé' })
  @ApiResponse({ status: 409, description: 'Unité a déjà un bail actif' })
  create(@Body() dto: CreateLeaseDto, @CurrentUser() user: { id: string }) {
    return this.leasesService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les baux' })
  @ApiResponse({ status: 200, description: 'Liste des baux' })
  findAll(@Query() query: QueryLeaseDto, @Req() request: RequestWithOwnerFilter) {
    return this.leasesService.findAll(query, request);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un bail' })
  @ApiResponse({ status: 200, description: 'Bail trouvé' })
  @ApiResponse({ status: 404, description: 'Bail non trouvé' })
  findOne(@Param('id') id: string, @Req() request: RequestWithOwnerFilter) {
    return this.leasesService.findOne(id, request);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un bail' })
  @ApiResponse({ status: 200, description: 'Bail modifié' })
  @ApiResponse({ status: 404, description: 'Bail non trouvé' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLeaseDto,
    @Req() request: RequestWithOwnerFilter,
  ) {
    return this.leasesService.update(id, dto, request);
  }

  @Post(':id/terminate')
  @ApiOperation({ summary: 'Terminer un bail' })
  @ApiResponse({
    status: 200,
    description: 'Bail terminé, unité libérée, échéances futures annulées',
  })
  @ApiResponse({ status: 404, description: 'Bail non trouvé' })
  @ApiResponse({ status: 409, description: 'Bail déjà terminé' })
  terminate(@Param('id') id: string, @Req() request: RequestWithOwnerFilter) {
    return this.leasesService.terminate(id, request);
  }
}
