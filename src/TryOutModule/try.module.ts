import { Module } from '@nestjs/common';
import { TryController } from './try.cotroller';

/**
 * Playground module for playing around
 */
@Module({
  imports: [],
  controllers: [TryController],
  providers: [],
})
export class TryModule {}
