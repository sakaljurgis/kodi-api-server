import { Controller, Get } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { configService } from '../config/config.service';

@Controller('try')
export class TryController {
  constructor(private orm: EntityManager) {}
  @Get('')
  async main() {
    //return await this.orm.query('select * from aliases');
    //return { hello: 'world' };
    return configService.getStaticFolder();
  }
}
