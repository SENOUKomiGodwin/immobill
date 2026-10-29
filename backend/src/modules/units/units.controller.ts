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
import { UnitsService } from './units.service';
import { CreateUnitDto, UpdateUnitDto, QueryUnitDto } from './dto/unit.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../../common/guards/owner-guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Request } from 'express';

@ApiTags('Units')
@Controller('units')
@UseGuards(JwtAuthGuard, OwnerGuard)
@ApiBearerAuth()
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une unité' })
  @ApiResponse({ status: 201, description: 'Unité créée' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Bien non trouvé' })
  create(@Body() dto: CreateUnitDto, @CurrentUser() user: { id: string }) {
    return this.unitsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les unités' })
  @ApiResponse({ status: 200, description: 'Liste des unités' })
  findAll(@Query() query: QueryUnitDto, @Req() request: Request) {
    return this.unitsService.findAll(query, request);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une unité' })
  @ApiResponse({ status: 200, description: 'Unité trouvée' })
  @ApiResponse({ status: 404, description: 'Unité non trouvée' })
  findOne(@Param('id') id: string, @Req() request: Request) {
    return this.unitsService.findOne(id, request);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une unité' })
  @ApiResponse({ status: 200, description: 'Unité modifiée' })
  @ApiResponse({ status: 404, description: 'Unité non trouvée' })
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto, @Req() request: Request) {
    return this.unitsService.update(id, dto, request);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une unité' })
  @ApiResponse({ status: 204, description: 'Unité supprimée' })
  @ApiResponse({ status: 404, description: 'Unité non trouvée' })
  @ApiResponse({ status: 403, description: 'Unité avec un bail actif' })
  remove(@Param('id') id: string, @Req() request: Request) {
    return this.unitsService.remove(id, request);
  }
}
