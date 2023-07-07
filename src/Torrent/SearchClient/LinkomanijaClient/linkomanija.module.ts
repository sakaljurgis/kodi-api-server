import { Module } from '@nestjs/common';
import { LinkomanijaClient } from './linkomanija.client';
import { LinkomanijaHttpClient } from './HttpClient/linkomanija-http.client';
import { LinkomanijaResponseParser } from './ResponseParser/linkomanija-response.parser';

//todo - make this as separate library
@Module({
  imports: [],
  providers: [
    LinkomanijaClient,
    LinkomanijaHttpClient,
    LinkomanijaResponseParser,
  ],
  exports: [LinkomanijaClient],
})
export class LinkomanijaModule {}
