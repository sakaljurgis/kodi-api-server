import { ConfigService } from './config.service';

export class VideoFilesConfig {
  constructor(private readonly configService: ConfigService) {
    this.configService = configService;
  }

  public getVideoFilesFolders(): string[] {
    return [this.configService.getEnv('VIDEO_FILES_FOLDER')];
  }

  public getVideoFilesExt(): string[] {
    return JSON.parse(this.configService.getEnv('VIDEO_FILES_EXT'));
  }

  public getPathPatternsToIgnore(): string[] {
    return JSON.parse(this.configService.getEnv('PATTERNS_TO_IGNORE'));
  }

  public getTorrentDownloadDir(): string {
    return this.configService.getEnv('VIDEO_FILES_FOLDER');
  }

  public getTransmissionOptions() {
    return {
      host: this.configService.getEnv('TRANSMISSION_CLIENT_HOST'), // # default 'localhost'
      //port: 9091,             // # default 9091
      username: this.configService.getEnv('TRANSMISSION_CLIENT_USER'), // # default blank
      password: this.configService.getEnv('TRANSMISSION_CLIENT_PASSWORD'), // # default blank
      //ssl: true,              //# default false use https
      //url: "/my/other/url"    //   # default '/transmission/rpc'
    };
  }
}
