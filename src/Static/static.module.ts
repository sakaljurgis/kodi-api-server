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
import { StaticService } from './static.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, process.env.STATIC_SERVE_FOLDER),
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
