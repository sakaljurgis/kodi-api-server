import { ConfigService } from './config.service';

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

  public getPathPatternsToIgnore(): string[] {
    return JSON.parse(this.configService.getEnv('PATTERNS_TO_IGNORE'));
  }

  public getTorrentDownloadDir(): string {
    return this.configService
      .getPaths()
      .getPathByEnvKey('TORRENT_DOWNLOAD_DIR');
  }

  public getTransmissionOptions() {
    return {
      host: this.configService.getEnv('TRANSMISSION_CLIENT_HOST'), // # default 'localhost'
      //port: 9091,             // # default 9091
      //username: "username",   // # default blank
      //password: "password",   // # default blank
      //ssl: true,              //# default false use https
      //url: "/my/other/url"    //   # default '/transmission/rpc'
    };
  }
}
