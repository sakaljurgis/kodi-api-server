import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KodiApiModule } from './KodiApi/kodi-api.module';
import { StaticModule } from './Static/static.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LrtCategory } from './KodiApi/LRT/LrtApiClient/Entity/lrt-category.entity';
import { RequestLogMiddleware } from './RequestLog/request-log.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    KodiApiModule,
    StaticModule,
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DB_PATH,
      entities: [LrtCategory],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLogMiddleware)
      .forRoutes({ path: '/*', method: RequestMethod.ALL });
  }
}
