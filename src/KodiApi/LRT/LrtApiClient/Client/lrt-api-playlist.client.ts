import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { MediaInfoResponseInterface } from '../Interface/media-info-response.interface';

@Injectable()
export class LrtApiPlaylistClient {
  constructor(private readonly httpService: HttpService) {}

  async getPlaylistUrl(mediaUrl: string): Promise<string> {
    const url =
      'https://www.lrt.lt/servisai/stream_url/vod/media_info/?url=/' + mediaUrl;
    const resp = await firstValueFrom(this.httpService.get(url));
    const mediaInfoResponse: MediaInfoResponseInterface = resp.data;

    return mediaInfoResponse.playlist_item.file;
  }
}
