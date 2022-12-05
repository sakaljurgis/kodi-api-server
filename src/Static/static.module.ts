import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { StaticController } from './static.controller';
import { RemoveQueryUrlRewriteMiddleware } from './UrlRewrite/url-rewrite.middleware';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../../static'),
    }),
  ],
  controllers: [StaticController],
  providers: [],
})
export class StaticModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RemoveQueryUrlRewriteMiddleware)
      .forRoutes({ path: '/*', method: RequestMethod.ALL });
  }
}
