import { Controller, Get, Post, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { CreateReminderDto, QueryReminderDto } from './dto/reminder.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../../common/guards/owner-guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestWithOwnerFilter } from '../../common/types/express.d';

@Controller('reminders')
@UseGuards(JwtAuthGuard, OwnerGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  create(@Body() createReminderDto: CreateReminderDto, @CurrentUser() user: { id: string }) {
    return this.remindersService.create(createReminderDto, user.id);
  }

  @Get()
  findAll(@Query() query: QueryReminderDto, @Req() request: RequestWithOwnerFilter) {
    return this.remindersService.findAll(query, request);
  }

  @Get('due/:dueId')
  findByDueId(@Param('dueId') dueId: string, @Req() request: RequestWithOwnerFilter) {
    return this.remindersService.findByDueId(dueId, request);
  }
}
