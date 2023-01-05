import { Module } from '@nestjs/common';
import { TryController } from './try.cotroller';
import { VideoFilesModule } from '../VideoFiles/video-files.module';

/**
 * Playground module for playing around
 */
@Module({
  imports: [VideoFilesModule],
  controllers: [TryController],
  providers: [],
})
export class TryModule {}
