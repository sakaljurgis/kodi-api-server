import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchStateEntity } from '../Shared/Entity/watch-state.entity';
import { FileEntity } from '../Shared/Entity/file.entity';
import { WatchStateService } from './watch-state.service';
import { WatchStateController } from './watch-state.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WatchStateEntity, FileEntity])],
  controllers: [WatchStateController],
  providers: [WatchStateService],
  exports: [WatchStateService],
})
export class WatchStateModule {}
