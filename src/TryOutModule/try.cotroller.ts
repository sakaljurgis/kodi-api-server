import { Controller, Get } from '@nestjs/common';
import { VideoFilesUpdateService } from '../VideoFiles/FileDbUpdater/video-files-update.service';

@Controller('try')
export class TryController {
  constructor(readonly videoFilesUpdateService: VideoFilesUpdateService) {}
  @Get('')
  main() {
    return this.videoFilesUpdateService.updateFsVideoFiles();
  }
}
