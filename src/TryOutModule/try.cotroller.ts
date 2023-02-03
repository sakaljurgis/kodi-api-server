import { Controller, Get } from '@nestjs/common';

@Controller('try')
export class TryController {
  @Get('')
  main() {
    return { hello: 'world' };
  }
}
