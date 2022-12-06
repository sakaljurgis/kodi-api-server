import { Injectable } from '@nestjs/common';
import ApiResponse from './Dto/api-response.dto';
import NotificationResponse from './Dto/notification-response';

@Injectable()
export class KodiApiService {
  getMainMenu(): string {
    return 'Hello World!';
  }

  createApiResponse(): ApiResponse {
    return new ApiResponse();
  }

  createNotificationResponse(
    message: string,
    refreshContainer = true,
  ): NotificationResponse {
    return new NotificationResponse(message, refreshContainer);
  }
}
