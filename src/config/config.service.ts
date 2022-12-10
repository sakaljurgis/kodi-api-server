import * as env from 'dotenv';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { LrtCategory } from '../KodiApi/LRT/LrtApiClient/Entity/lrt-category.entity';
import { join } from 'path';
import { TitleEntity } from '../KodiApi/AllFiles/Entity/title.entity';

env.config();

export class ConfigService {
  public getEnv(key: string): any {
    return process.env[key];
  }

  public getPort(): number {
    const port = this.getEnv('PORT');

    return port ? parseInt(port) : 3000;
  }

  public getTypeOrmConfig(): TypeOrmModuleOptions {
    return {
      type: 'sqlite',
      database: this.getEnv('DB_PATH'),
      entities: [LrtCategory, TitleEntity],
    };
  }

  public getStaticRequestsLogPath(): string {
    return join(this.getRootPath(), this.getEnv('LOG_FILE_REQUESTS'));
  }

  public getStaticFolder(): string {
    return join(this.getRootPath(), this.getEnv('STATIC_SERVE_FOLDER'));
  }

  public getRecentSearchesFolder(): string {
    return join(this.getRootPath(), this.getEnv('RECENT_SEARCHES_FOLDER'));
  }

  private getRootPath(): string {
    return join(__dirname, '../..');
  }
}

export const configService = new ConfigService();
