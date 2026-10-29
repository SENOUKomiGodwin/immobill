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
import { PropertiesService } from './properties.service';
import { CreatePropertyDto, UpdatePropertyDto, QueryPropertyDto } from './dto/property.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../../common/guards/owner-guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Request } from 'express';

@ApiTags('Properties')
@Controller('properties')
@UseGuards(JwtAuthGuard, OwnerGuard)
@ApiBearerAuth()
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un bien' })
  @ApiResponse({ status: 201, description: 'Bien créé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  create(@Body() dto: CreatePropertyDto, @CurrentUser() user: { id: string }) {
    return this.propertiesService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les biens' })
  @ApiResponse({ status: 200, description: 'Liste des biens' })
  findAll(@Query() query: QueryPropertyDto, @Req() request: Request) {
    return this.propertiesService.findAll(query, request);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un bien' })
  @ApiResponse({ status: 200, description: 'Bien trouvé' })
  @ApiResponse({ status: 404, description: 'Bien non trouvé' })
  findOne(@Param('id') id: string, @Req() request: Request) {
    return this.propertiesService.findOne(id, request);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un bien' })
  @ApiResponse({ status: 200, description: 'Bien modifié' })
  @ApiResponse({ status: 404, description: 'Bien non trouvé' })
  update(@Param('id') id: string, @Body() dto: UpdatePropertyDto, @Req() request: Request) {
    return this.propertiesService.update(id, dto, request);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un bien' })
  @ApiResponse({ status: 204, description: 'Bien supprimé' })
  @ApiResponse({ status: 404, description: 'Bien non trouvé' })
  @ApiResponse({ status: 403, description: 'Bien avec des unités' })
  remove(@Param('id') id: string, @Req() request: Request) {
    return this.propertiesService.remove(id, request);
  }
}
