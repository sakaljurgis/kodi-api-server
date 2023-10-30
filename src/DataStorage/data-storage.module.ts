import { Module } from '@nestjs/common';
import { JsonFileDataStorageService } from './json-file-data-storage.service';

@Module({
  imports: [],
  controllers: [],
  providers: [JsonFileDataStorageService],
  exports: [JsonFileDataStorageService],
})
export class DataStorageModule {}
