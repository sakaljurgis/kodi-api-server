import { ConfigService } from './config.service';

export class RecentSearchesConfig {
  constructor(private readonly configService: ConfigService) {
    this.configService = configService;
  }

  public getRecentSearchesFolder(): string {
    return this.configService
      .getPaths()
      .getPathByEnvKey('RECENT_SEARCHES_FOLDER');
  }

  public getRecentSearchesLimit(): number {
    return parseInt(this.configService.getEnv('RECENT_SEARCHES_LIMIT'));
  }
}
