import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LrtApiSearchClient } from './Client/lrt-api-search.client';
import { LrtApiClient } from './lrt-api.client';
import { LrtApiCategoryClient } from './Client/lrt-api-category.client';
import { LrtApiPlaylistClient } from './Client/lrt-api-playlist.client';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LrtCategory } from './Entity/lrt-category.entity';

@Module({
  imports: [
    HttpModule.register({
      withCredentials: true,
    }),
    TypeOrmModule.forFeature([LrtCategory]),
  ],
  providers: [
    LrtApiSearchClient,
    LrtApiCategoryClient,
    LrtApiPlaylistClient,
    LrtApiClient,
  ],
  exports: [LrtApiClient],
})
export class LrtApiClientModule {}
