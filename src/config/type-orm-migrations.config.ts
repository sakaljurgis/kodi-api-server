import { DataSource, DataSourceOptions } from 'typeorm';
import { configService } from './config.service';

/**
 * config for typeorm cli
 */
export default new DataSource(<DataSourceOptions>{
  type: configService.getTypeOrmConfig().type,
  database: configService.getTypeOrmConfig().database,
  migrations: ['migrations/*{.ts,.js}'],
});
