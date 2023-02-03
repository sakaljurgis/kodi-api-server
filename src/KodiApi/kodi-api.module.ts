import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { KodiApiController } from './kodi-api.controller';
import { KodiApiUrlRewriteMiddleware } from './UrlRewrite/url-rewrite.middleware';
import { LrtModule } from './LRT/lrt.module';
import { KodiApiService } from './kodi-api.service';
import { KodiApiResponseFactory } from './kodi-api-response.factory';
import { AllFilesModule } from './AllFiles/all-files.module';
import { TorrentModule } from './Torrent/torrent.module';

@Module({
  imports: [LrtModule, AllFilesModule, TorrentModule],
  controllers: [KodiApiController],
  providers: [KodiApiService, KodiApiResponseFactory],
})
export class KodiApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(KodiApiUrlRewriteMiddleware)
      .forRoutes({ path: '/api*', method: RequestMethod.ALL });
  }
}
