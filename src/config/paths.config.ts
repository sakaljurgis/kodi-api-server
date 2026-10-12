import { ConfigService } from './config.service';
import { join } from 'path';

export class PathsConfig {
  constructor(private readonly configService: ConfigService) {
    this.configService = configService;
  }

  public getStaticRequestsLogPath(): string {
    return join(
      this.getDataRoot(),
      'requests-log',
      this.configService.getEnv('LOG_FILE_REQUESTS_NAME'),
    );
  }

  public getStaticFolder(): string {
    return join(this.getDataRoot(), 'static');
  }

  /** the docker volumes; DATA_ROOT overrides it, e.g. for a local run outside docker */
  public getDataRoot(): string {
    return this.configService.getEnv('DATA_ROOT') || '/srv/data';
  }

  public getPathByEnvKey(key: string) {
    const relPath = this.configService.getEnv(key);

    return this.getPath(relPath);
  }

  public getDbFolderPath(): string {
    return join(this.getDataRoot(), 'db');
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
