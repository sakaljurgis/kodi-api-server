import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { KodiApiModule } from './KodiApi/kodi-api.module';
import { StaticModule } from './Static/static.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestLogMiddleware } from './RequestLog/request-log.middleware';
import { TryModule } from './TryOutModule/try.module';
import { configService } from './config/config.service';

@Module({
  imports: [
    TryModule,
    KodiApiModule,
    StaticModule,
    TypeOrmModule.forRoot(configService.getTypeOrmConfig()),
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
