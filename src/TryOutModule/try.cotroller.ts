import { Controller, Get } from '@nestjs/common';
import { EntityManager } from 'typeorm';

@Controller('try')
export class TryController {
  constructor(private orm: EntityManager) {}
  @Get('')
  async main() {
    return await this.orm.query('select * from aliases');
  }
}
