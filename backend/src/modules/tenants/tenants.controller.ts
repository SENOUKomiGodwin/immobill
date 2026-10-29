import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto, QueryTenantDto } from './dto/tenant.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../../common/guards/owner-guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Request } from 'express';

@ApiTags('Tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard, OwnerGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un locataire' })
  @ApiResponse({ status: 201, description: 'Locataire créé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  create(@Body() dto: CreateTenantDto, @CurrentUser() user: { id: string }) {
    return this.tenantsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les locataires' })
  @ApiResponse({ status: 200, description: 'Liste des locataires' })
  findAll(@Query() query: QueryTenantDto, @Req() request: Request) {
    return this.tenantsService.findAll(query, request);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un locataire' })
  @ApiResponse({ status: 200, description: 'Locataire trouvé' })
  @ApiResponse({ status: 404, description: 'Locataire non trouvé' })
  findOne(@Param('id') id: string, @Req() request: Request) {
    return this.tenantsService.findOne(id, request);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un locataire' })
  @ApiResponse({ status: 200, description: 'Locataire modifié' })
  @ApiResponse({ status: 404, description: 'Locataire non trouvé' })
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto, @Req() request: Request) {
    return this.tenantsService.update(id, dto, request);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un locataire' })
  @ApiResponse({ status: 204, description: 'Locataire supprimé' })
  @ApiResponse({ status: 404, description: 'Locataire non trouvé' })
  @ApiResponse({ status: 403, description: 'Locataire avec un bail actif' })
  remove(@Param('id') id: string, @Req() request: Request) {
    return this.tenantsService.remove(id, request);
  }
}
