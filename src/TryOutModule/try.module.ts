import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { TryController } from './try.cotroller';
import { configService } from '../config/config.service';

/**
 * Playground module for playing around
 */
@Module({
  imports: [TypeOrmModule.forRoot(configService.getTypeOrmConfig())],
  controllers: [TryController],
  providers: [],
})
export class TryModule {}
