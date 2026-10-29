import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto, CancelExpenseDto, QueryExpenseDto } from './dto/expense.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../../common/guards/owner-guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestWithOwnerFilter } from '../../common/types/express.d';

@ApiTags('Expenses')
@Controller('expenses')
@UseGuards(JwtAuthGuard, OwnerGuard)
@ApiBearerAuth()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une dépense' })
  @ApiResponse({ status: 201, description: 'Dépense créée' })
  create(
    @Body() dto: CreateExpenseDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.expensesService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les dépenses' })
  @ApiResponse({ status: 200, description: 'Liste des dépenses' })
  findAll(@Query() query: QueryExpenseDto, @Req() request: RequestWithOwnerFilter) {
    return this.expensesService.findAll(query, request);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une dépense' })
  @ApiResponse({ status: 200, description: 'Dépense trouvée' })
  findOne(@Param('id') id: string, @Req() request: RequestWithOwnerFilter) {
    return this.expensesService.findOne(id, request);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une dépense' })
  @ApiResponse({ status: 200, description: 'Dépense modifiée' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
    @Req() request: RequestWithOwnerFilter,
  ) {
    return this.expensesService.update(id, dto, request);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Annuler une dépense avec motif' })
  @ApiResponse({ status: 200, description: 'Dépense annulée' })
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelExpenseDto,
    @Req() request: RequestWithOwnerFilter,
  ) {
    return this.expensesService.cancel(id, dto, request);
  }
}
