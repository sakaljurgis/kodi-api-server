import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { readFile, writeFile } from 'fs/promises';
import { configService, ConfigService } from '../config/config.service';
import { fileExistsSync } from 'tsconfig-paths/lib/filesystem';
import { DataStorageServiceInterface } from './data-storage-service.interface';

/**
 * This service is used to store data in json files.
 * It is cached in memory to save on readFile calls.
 * Use set(cache = false) to skip caching for large files.
 */
@Injectable()
export class JsonFileDataStorageService implements DataStorageServiceInterface {
  private readonly data: Record<string, unknown> = {};
  private readonly config: ConfigService;
  constructor() {
    this.config = configService;
  }

  async get<T>(key: string, fallback: T): Promise<T> {
    if (this.data[key]) {
      return this.data[key] as T;
    }

    const filePath = this.getFilePath(key);
    if (fileExistsSync(filePath)) {
      try {
        const rawData = await readFile(filePath);
        const data = JSON.parse(rawData.toString());
        this.data[key] = data;

        return data as T;
      } catch (e) {
        console.error(e);

        return fallback;
      }
    }

    return fallback;
  }

  async set(key: string, data: unknown, cache = true): Promise<void> {
    if (cache) {
      this.data[key] = data;
    }

    const filePath = this.getFilePath(key);
    await writeFile(filePath, JSON.stringify(data, null, 2));
  }

  private getFilePath(key: string): string {
    return join(this.config.getPaths().getDbFolderPath(), key + '.json');
  }
}
