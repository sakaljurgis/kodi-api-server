import { Injectable } from '@nestjs/common';
import ApiResponse from './Dto/api-response.dto';
import NotificationResponse from './Dto/notification-response';

@Injectable()
export class KodiApiResponseFactory {
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
