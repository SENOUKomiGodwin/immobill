import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, CancelPaymentDto, QueryPaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../../common/guards/owner-guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestWithOwnerFilter } from '../../common/types/express.d';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, OwnerGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un paiement' })
  @ApiResponse({ status: 201, description: 'Paiement créé avec numéro de quittance' })
  @ApiResponse({ status: 400, description: 'Montant dépasse le solde' })
  @ApiResponse({ status: 404, description: 'Échéance non trouvée' })
  create(@Body() dto: CreatePaymentDto, @CurrentUser() user: { id: string }) {
    return this.paymentsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les paiements' })
  @ApiResponse({ status: 200, description: 'Liste des paiements' })
  findAll(@Query() query: QueryPaymentDto, @Req() request: RequestWithOwnerFilter) {
    return this.paymentsService.findAll(query, request);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un paiement' })
  @ApiResponse({ status: 200, description: 'Paiement trouvé' })
  @ApiResponse({ status: 404, description: 'Paiement non trouvé' })
  findOne(@Param('id') id: string, @Req() request: RequestWithOwnerFilter) {
    return this.paymentsService.findOne(id, request);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Annuler un paiement' })
  @ApiResponse({ status: 200, description: 'Paiement annulé avec audit log' })
  @ApiResponse({ status: 400, description: 'Paiement déjà annulé' })
  @ApiResponse({ status: 404, description: 'Paiement non trouvé' })
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelPaymentDto,
    @Req() request: RequestWithOwnerFilter,
  ) {
    return this.paymentsService.cancel(id, dto, request);
  }
}
