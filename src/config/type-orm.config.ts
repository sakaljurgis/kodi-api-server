import { LrtCategory } from '../KodiApi/LRT/LrtApiClient/Entity/lrt-category.entity';
import { ConfigService } from './config.service';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { TitleEntity } from '../VideoFiles/Entity/title.entity';
import { FileEntity } from '../VideoFiles/Entity/file.entity';

export class TypeOrmConfig {
  constructor(configService: ConfigService) {
    this.type = 'sqlite';
    this.database = configService.getEnv('DB_PATH');
    this.entities = [LrtCategory, TitleEntity, FileEntity];
  }
  type: 'sqlite';
  database: string;
  entities: Array<EntityClassOrSchema>;
}
