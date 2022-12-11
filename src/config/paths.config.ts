import { ConfigService } from './config.service';
import { join } from 'path';

export class PathsConfig {
  constructor(private readonly configService: ConfigService) {
    this.configService = configService;
  }

  public getStaticRequestsLogPath(): string {
    return join(
      this.getRootPath(),
      this.configService.getEnv('LOG_FILE_REQUESTS'),
    );
  }

  public getStaticFolder(): string {
    return join(
      this.getRootPath(),
      this.configService.getEnv('STATIC_SERVE_FOLDER'),
    );
  }

  public getRecentSearchesFolder(): string {
    return join(
      this.getRootPath(),
      this.configService.getEnv('RECENT_SEARCHES_FOLDER'),
    );
  }

  private getRootPath(): string {
    return join(__dirname, '../..');
  }
}
