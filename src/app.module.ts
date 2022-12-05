import {
  //MiddlewareConsumer,
  Module,
  //NestModule,
  //RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
//import { AppService } from './app.service';
//import { KodiApiController } from './KodiApi/kodi-api.controller';
//import { StaticController } from './Static/static.controller';
//import { KodiApiUrlRewriteMiddleware } from './KodiApi/UrlRewrite/url-rewrite.middleware';
import { KodiApiModule } from './KodiApi/kodi-api.module';
import { StaticModule } from './Static/static.module';

@Module({
  imports: [ConfigModule.forRoot(), KodiApiModule, StaticModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer
//       .apply(KodiApiUrlRewriteMiddleware)
//       .forRoutes({ path: '/api*', method: RequestMethod.ALL });
//   }
// }
