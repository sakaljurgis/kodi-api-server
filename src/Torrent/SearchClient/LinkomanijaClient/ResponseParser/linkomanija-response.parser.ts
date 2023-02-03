import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import * as url from 'url';
import { TorrentSearchResult } from '../../../Dto/torrent-search-result.class';

@Injectable()
export class LinkomanijaResponseParser {
  parseRaw(rawData: string): TorrentSearchResult[] {
    const $ = cheerio.load(rawData);
    const torrents = [];

    $('body').find('br').replaceWith('\n');

    $('table').each(function (iTable, elTable) {
      $(elTable)
        .find('a.index')
        .each(function (iA, elA) {
          const torrent = new TorrentSearchResult();
          const arrTorDetails = $(elA.parent.parent).find('td');

          let sNameAndDesc = $(arrTorDetails[1]).text();
          sNameAndDesc = sNameAndDesc.split('\t').join('');
          const arrNameAndDesc = sNameAndDesc
            .split('\n')
            .filter(function (val) {
              return val;
            });

          torrent.name = arrNameAndDesc[0] ? arrNameAndDesc[0].trim() : '';
          torrent.info = arrNameAndDesc[1] ? arrNameAndDesc[1].trim() : '';
          torrent.date = $(arrTorDetails[4]).text().split('\n')[0];
          torrent.size = $(arrTorDetails[5]).text().split('\n').join(' ');
          torrent.seeders = $(arrTorDetails[7]).text().split('\n').join(' ');
          torrent.leechers = $(arrTorDetails[8]).text().split('\n').join(' ');

          if ('attribs' in elA) {
            const { id, name } = url.parse(elA.attribs['href'], true).query;
            torrent.id = id as string;

            const relDlUrl = encodeURI(
              '/download.php?id=' +
                id +
                '&passkey=' +
                process.env['LINKOMANIJA_PASSKEY'] +
                '&name=' +
                name,
            );

            torrent.magnet = 'https://www.linkomanija.net' + relDlUrl;
          }

          const arrImgs = $(arrTorDetails).find('img');

          if (
            arrImgs &&
            arrImgs[0] &&
            'attribs' in arrImgs[0] &&
            arrImgs[0].attribs &&
            arrImgs[0].attribs.alt
          ) {
            torrent.info =
              arrImgs[0].attribs.alt +
              (torrent.info ? ': ' + torrent.info : '');
          }

          torrents.push(torrent);
        });
    });

    return torrents;
  }
}
