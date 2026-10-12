import { ConfigService } from './config.service';
import { join } from 'path';

export class RecentSearchesConfig {
  constructor(private readonly configService: ConfigService) {
    this.configService = configService;
  }

  public getRecentSearchesFolder(): string {
    return join(this.configService.getPaths().getDataRoot(), 'recent-searches');
  }

  public getRecentSearchesLimit(): number {
    return parseInt(this.configService.getEnv('RECENT_SEARCHES_LIMIT'));
  }
}
