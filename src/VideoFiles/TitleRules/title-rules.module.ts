import { Module } from '@nestjs/common';
import { DataStorageModule } from '../../DataStorage/data-storage.module';
import { TitleRulesService } from './title-rules.service';

@Module({
  imports: [DataStorageModule],
  providers: [TitleRulesService],
  exports: [TitleRulesService],
})
export class TitleRulesModule {}
