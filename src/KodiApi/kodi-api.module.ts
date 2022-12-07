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

@Module({
  imports: [LrtModule],
  controllers: [KodiApiController],
  providers: [KodiApiService],
})
export class KodiApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(KodiApiUrlRewriteMiddleware)
      .forRoutes({ path: '/api*', method: RequestMethod.ALL });
  }
}
