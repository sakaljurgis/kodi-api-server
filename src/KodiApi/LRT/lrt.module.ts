import { Module } from '@nestjs/common';
import { LrtController } from './lrt.controller';

@Module({
  controllers: [LrtController],
  providers: [],
})
export class LrtModule {}
