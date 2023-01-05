import { ConfigService } from './config.service';
import { join } from 'path';

export class VideoFilesConfig {
  constructor(private readonly configService: ConfigService) {
    this.configService = configService;
  }

  public getVideoFilesFolders(): string[] {
    return JSON.parse(this.configService.getEnv('VIDEO_FILES_FOLDERS'));
  }

  public getVideoFilesExt(): string[] {
    return JSON.parse(this.configService.getEnv('VIDEO_FILES_EXT'));
  }
}
