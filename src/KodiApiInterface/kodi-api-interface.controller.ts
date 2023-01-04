import { Controller, Get, Header, Res } from '@nestjs/common';
import { join } from 'path';
import { createReadStream } from 'fs';
import { Response } from 'express';

@Controller('if')
export class KodiApiInterfaceController {
  @Get()
  @Header('content-type', 'text/html')
  async main(@Res() res: Response) {
    const readable = createReadStream(join(__dirname, './View/if.html'));
    readable.pipe(res);
  }
}
