import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Post,
  Redirect,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { LibraryService } from './library.service';
import { TitleRule } from '../VideoFiles/TitleRules/title-rule';

@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get()
  @Header('content-type', 'text/html')
  main(@Res() res: Response) {
    createReadStream(join(__dirname, './View/index.html')).pipe(res);
  }

  @Get('data')
  getData() {
    return this.libraryService.getData();
  }

  /** saving or deleting a rule re-parses the titles right away */
  @Post('rules')
  saveRule(@Body() rule: Partial<TitleRule>) {
    return this.libraryService.saveRule(rule);
  }

  @Delete('rules/:id')
  deleteRule(@Param('id') id: string) {
    return this.libraryService.deleteRule(id);
  }

  @Post('hidden')
  setHidden(@Body() body: { fileIds: number[]; hidden: boolean }) {
    return this.libraryService.setHidden(body?.fileIds, body?.hidden);
  }

  @Post('reparse')
  reparse() {
    return this.libraryService.reparse();
  }

  /** every automatic match searched again; answers when done */
  @Post('artwork/refetch')
  refetchArtwork() {
    return this.libraryService.refetchArtwork();
  }

  /** picks the match by hand: `{tmdb: <id or link>}`, `{tmdb: null}` for none */
  @Post('artwork/:id')
  setArtwork(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { tmdb: unknown },
  ) {
    return this.libraryService.setArtwork(id, body?.tmdb ?? null);
  }

  /** back to the automatic match */
  @Post('artwork/:id/auto')
  resetArtwork(@Param('id', ParseIntPipe) id: number) {
    return this.libraryService.resetArtwork(id);
  }
}

/** the aliases are contains rules now */
@Controller('aliases')
export class AliasesRedirectController {
  @Get()
  @Redirect('/library#rules')
  redirect() {
    return;
  }
}
