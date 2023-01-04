import { Module } from '@nestjs/common';
import { KodiApiInterfaceController } from './kodi-api-interface.controller';

/**
 * Playground module for playing around
 */
@Module({
  imports: [],
  controllers: [KodiApiInterfaceController],
  providers: [],
})
export class KodiApiInterfaceModule {}
