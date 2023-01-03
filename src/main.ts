import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configService } from './config/config.service';
import { HttpExceptionFilter } from './Exception/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(configService.getPort());
}

bootstrap();
