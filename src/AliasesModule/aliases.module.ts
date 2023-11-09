import { Module } from '@nestjs/common';
import { AliasesController } from './aliases.cotroller';
import { DataStorageModule } from '../DataStorage/data-storage.module';

/**
 * Playground module for playing around
 */
@Module({
  imports: [DataStorageModule],
  controllers: [AliasesController],
  providers: [],
})
export class AliasesModule {}
