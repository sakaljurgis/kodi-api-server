import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KodiApiModule } from './KodiApi/kodi-api.module';
import { StaticModule } from './Static/static.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LrtCategory } from './KodiApi/LRT/LrtApiClient/Entity/lrt-category.entity';

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
export class AppModule {}
