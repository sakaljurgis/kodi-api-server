import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Controller('try')
export class TryController {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  @Get('')
  main() {
    //return this.ds.query('select category_url from lrt_categories where category_id = $1', ['2720']);
    // return this.ds
    //   .createQueryBuilder()
    //   .select()
    //   .from(null, 'lrt_categories')
    //   .getMany();
    return this.ds.query('select * from lrt_categories');
    //return { hello: 'world' };
  }
}
