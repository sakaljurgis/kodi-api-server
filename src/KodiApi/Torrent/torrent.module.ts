import { Module } from '@nestjs/common';
import { TorrentService } from './torrent.service';
import { TorrentController } from './torrent.controller';
import { KodiApiResponseFactory } from '../kodi-api-response.factory';
import { SearchClientModule } from '../../Torrent/SearchClient/search-client.module';
import { RecentSearchesModule } from '../RecentSearches/recent-searches.module';
import { TorrentDownloadClientModule } from '../../Torrent/DownloadClient/torrent-download-client.module';
import { AllFilesModule } from '../AllFiles/all-files.module';
import { TorrentSeedClientModule } from '../../Torrent/SeedClient/torrent-seed-client.module';

@Module({
  imports: [
    SearchClientModule,
    RecentSearchesModule,
    TorrentDownloadClientModule,
    AllFilesModule,
    TorrentSeedClientModule,
  ],
  controllers: [TorrentController],
  providers: [TorrentService, KodiApiResponseFactory],
})
export class TorrentModule {}
