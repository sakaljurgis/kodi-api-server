import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { StaticController } from './static.controller';
import { RemoveQueryUrlRewriteMiddleware } from './UrlRewrite/url-rewrite.middleware';
import { StaticService } from './static.service';
import { configService } from '../config/config.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: configService.getStaticFolder(),
    }),
  ],
  controllers: [StaticController],
  providers: [StaticService],
})
export class StaticModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RemoveQueryUrlRewriteMiddleware)
      .forRoutes({ path: '/*', method: RequestMethod.ALL });
  }
}
