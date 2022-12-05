import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KodiApiModule } from './KodiApi/kodi-api.module';
import { StaticModule } from './Static/static.module';

@Module({
  imports: [ConfigModule.forRoot(), KodiApiModule, StaticModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
