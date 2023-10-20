import { ConfigService } from './config.service';

export class VideoFilesConfig {
  constructor(private readonly configService: ConfigService) {
    this.configService = configService;
  }

  public getVideoFilesFolders(): string[] {
    const folders: string[] = [];
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith('VIDEO_FILES_FOLDER') && process.env[key]) {
        folders.push(process.env[key]);
      }
    });

    return folders;
  }

  public getVideoFilesExt(): string[] {
    return ['.mkv', '.mp4', '.avi'];
  }

  public getPathPatternsToIgnore(): string[] {
    return JSON.parse(this.configService.getEnv('PATTERNS_TO_IGNORE'));
  }

  public getTorrentDownloadDirs(): string[] {
    return this.getVideoFilesFolders();
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
