import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';
import { configService } from './config.service';

// Through ts-node (npm run typeorm:*) this is src/config/*.ts → <root>/migrations/*.ts.
// Compiled (typeorm:run-migrations:prod, start.sh after the build) → dist/migrations/*.js,
// without the .d.ts files next to them.
const migrationsExt = __filename.endsWith('.ts') ? 'ts' : 'js';

/**
 * config for typeorm cli
 */
export default new DataSource(<DataSourceOptions>{
  type: configService.getTypeOrmConfig().type,
  database: configService.getTypeOrmConfig().database,
  migrations: [join(__dirname, '../../migrations', `*.${migrationsExt}`)],
});
