import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../../common/guards/owner-guard';
import { RequestWithOwnerFilter } from '../../common/types/express.d';

@Controller('files')
@UseGuards(JwtAuthGuard, OwnerGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload-simple')
  upload(@Body() body: { file_name: string; content_type: string; size: number; file_key: string }, @Req() request: RequestWithOwnerFilter) {
    return this.filesService.upload(body, request);
  }

  @Post('signed-url')
  createSignedUrl(@Body() body: { file_uri: string; expires_in: number }, @Req() request: RequestWithOwnerFilter) {
    return this.filesService.createSignedUrl(body, request);
  }
}
