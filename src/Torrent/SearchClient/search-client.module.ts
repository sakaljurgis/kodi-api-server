import { LinkomanijaModule } from './LinkomanijaClient/linkomanija.module';
import { Module } from '@nestjs/common';
import { SearchClientFacade, SearchClients } from './search-client.facade';
import { LinkomanijaClientBridge } from './ClientBridge/linkomanija-client.bridge';

@Module({
  imports: [LinkomanijaModule],
  providers: [
    SearchClientFacade,
    LinkomanijaClientBridge,
    {
      provide: SearchClients,
      useFactory: (...clients) => clients,
      inject: [LinkomanijaClientBridge],
    },
  ],
  exports: [SearchClientFacade],
})
export class SearchClientModule {}
