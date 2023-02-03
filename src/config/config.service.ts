import * as env from 'dotenv';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { TypeOrmConfig } from './type-orm.config';
import { PathsConfig } from './paths.config';
import { VideoFilesConfig } from './video-files.config';
import { RecentSearchesConfig } from './recent-searches.config';

env.config();

export class ConfigService {
  private typeOrmConfig: TypeOrmConfig = new TypeOrmConfig(this);
  private pathsConfig: PathsConfig = new PathsConfig(this);
  private videoFilesConfig: VideoFilesConfig = new VideoFilesConfig(this);
  private recentSearches: RecentSearchesConfig = new RecentSearchesConfig(this);

  public getEnv(key: string): any {
    return process.env[key];
  }

  public getPort(): number {
    const port = this.getEnv('PORT');

    return port ? parseInt(port) : 3000;
  }

  public getTypeOrmConfig(): TypeOrmModuleOptions {
    return this.typeOrmConfig;
  }

  public getPaths(): PathsConfig {
    return this.pathsConfig;
  }

  public getVideoFilesConfig(): VideoFilesConfig {
    return this.videoFilesConfig;
  }

  public getRecentSearchesConfig(): RecentSearchesConfig {
    return this.recentSearches;
  }
}

export const configService = new ConfigService();
