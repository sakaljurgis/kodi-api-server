import { ConfigService } from './config.service';
import { join } from 'path';

export class PathsConfig {
  constructor(private readonly configService: ConfigService) {
    this.configService = configService;
  }

  public getStaticRequestsLogPath(): string {
    return this.getPathByEnvKey('LOG_FILE_REQUESTS');
  }

  public getStaticFolder(): string {
    return this.getPathByEnvKey('STATIC_SERVE_FOLDER');
  }

  public getRecentSearchesFolder(): string {
    return this.getPathByEnvKey('RECENT_SEARCHES_FOLDER');
  }

  private getPathByEnvKey(key: string) {
    const relPath = this.configService.getEnv(key);

    return this.getPath(relPath);
  }

  private getPath(relPath: string) {
    if (relPath[0] === '/') {
      //this is an absolute path
      return relPath;
    }

    return join(this.getRootPath(), relPath);
  }

  private getRootPath(): string {
    return this.configService.getEnv('PWD');
  }
}
