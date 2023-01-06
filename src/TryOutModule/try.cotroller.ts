import { Controller, Get } from '@nestjs/common';
import { VideoFilesFacade } from '../VideoFiles/video-files.facade';

@Controller('try')
export class TryController {
  constructor(readonly videoFilesFacade: VideoFilesFacade) {}

  @Get('')
  main() {
    this.videoFilesFacade.updateFsVideoFiles();
    return { doing: 'something' };
  }
}
