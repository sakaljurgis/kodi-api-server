import { LrtCategory } from '../KodiApi/LRT/LrtApiClient/Entity/lrt-category.entity';
import { TitleEntity } from '../KodiApi/AllFiles/Entity/title.entity';
import { FileEntity } from '../KodiApi/AllFiles/Entity/file.entity';
import { ConfigService } from './config.service';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

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
