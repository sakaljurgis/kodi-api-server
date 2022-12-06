import { Injectable } from '@nestjs/common';

@Injectable()
export class LrtService {
  getMainMenu(): string {
    return 'Hello World!';
  }
}
