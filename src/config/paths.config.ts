import { ConfigService } from './config.service';
import { join } from 'path';

export class PathsConfig {
  constructor(private readonly configService: ConfigService) {
    this.configService = configService;
  }

  public getStaticRequestsLogPath(): string {
    return join(
      '/srv/data/requests-log',
      this.configService.getEnv('LOG_FILE_REQUESTS_NAME'),
    );
  }

  public getStaticFolder(): string {
    return '/srv/data/static';
  }

  public getPathByEnvKey(key: string) {
    const relPath = this.configService.getEnv(key);

    return this.getPath(relPath);
  }

  public getDbFolderPath(): string {
    return '/srv/data/db';
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
