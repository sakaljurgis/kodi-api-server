import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtworkEntity } from '../Shared/Entity/artwork.entity';
import { FileEntity } from '../Shared/Entity/file.entity';
import { ArtworkService } from './artwork.service';
import { TmdbClient } from './tmdb.client';

/** posters and backdrops from TMDB (needs TMDB_API_KEY) */
@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([ArtworkEntity, FileEntity])],
  providers: [ArtworkService, TmdbClient],
  exports: [ArtworkService],
})
export class ArtworkModule {}
