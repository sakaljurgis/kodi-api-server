import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    //const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // 200 response is bad practice,
    // but currently it is the only way KODi will show what happened
    response.status(200).json({
      // original response:
      response: exception.getResponse(),
      // for KODI:
      notification: status + ': ' + exception.message,
      refreshContainer: false,
      updateList: false,
      // msgBoxOK: status + ': ' + exception.message,
    });
  }
}
