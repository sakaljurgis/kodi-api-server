import { ConfigService } from './config.service';

export class RecentSearchesConfig {
  constructor(private readonly configService: ConfigService) {
    this.configService = configService;
  }

  public getRecentSearchesFolder(): string {
    return '/srv/data/recent-searches';
  }

  public getRecentSearchesLimit(): number {
    return parseInt(this.configService.getEnv('RECENT_SEARCHES_LIMIT'));
  }
}
