import * as env from 'dotenv';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { TypeOrmConfig } from './type-orm.config';
import { PathsConfig } from './paths.config';

env.config();

export class ConfigService {
  private typeOrmConfig: TypeOrmConfig = new TypeOrmConfig(this);
  private pathsConfig: PathsConfig = new PathsConfig(this);

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
}

export const configService = new ConfigService();
