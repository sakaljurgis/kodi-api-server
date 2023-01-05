import { VideoFilePathDto } from '../Dto/video-file-path.dto';
import { Injectable } from '@nestjs/common';
import * as tnp from 'torrent-name-parser';

//todo - refactor this copy-paste, add types, ect.
//todo - make an interface and add as info/data provider (fileEntity data expander interface)
@Injectable()
export class VideoFileTitleService {
  constructor() {
    tnp.configure({ sample: /sample/i }, { sample: 'boolean' });
    tnp.configure({ year: /([\[\(]?((?:19[0-9][0-9]|20[0-2][0-9]))[\]\)]?)/ });
    tnp.configure({ container: /MKV|AVI|MP4|mkv|avi|mp4/i });
  }

  extractTitleInfo(filePath: VideoFilePathDto) {
    const infos = [];
    const arrPath = filePath.relativePath.split('/');

    for (let i = 0; i < arrPath.length; i++) {
      const info = tnp(arrPath[i]);

      //season match from title
      if (!info.season) {
        let rx = /season ([0-9]{1,2})/i;
        let match = info.title.match(rx);
        if (match) {
          info.season = parseInt(match[1]);
          info.title = info.title.replace(rx, '').trim();
        }

        rx = /([0-9]{1,2}) sezonas/i;
        match = info.title.match(rx);
        if (match) {
          info.season = parseInt(match[1]);
          info.title = info.title.replace(rx, '').trim();
        }
      }

      infos.push(info);
    }

    const obj = {
      info: undefined,
      infos: undefined,
    };

    obj.info = this.combineInfos(infos);
    //obj.info.size = convertSizeToHR(obj.size);
    obj.infos = infos;

    return obj;
  }

  private combineInfos(infos) {
    const combined = {
      title: undefined,
      season: undefined,
      episode: undefined,
    };

    for (let i = 0; i < infos.length; i++) {
      const info = infos[i];

      combined.title = combined.title ? combined.title : info.title;

      const season = info.season ? info.season : combined.season;
      const episode = info.episode ? info.episode : combined.episode;

      if (season !== undefined) {
        combined.season = season;
      }

      if (episode !== undefined) {
        combined.episode = episode;
      }
    }

    combined.title = this.removePartNumberFromTitle(combined.title);
    combined.title = this.checkForAliases(combined.title);
    return combined;
  }

  private removePartNumberFromTitle(title) {
    const arrTitle = title.split(' ');
    if (this.isNumeric(arrTitle[arrTitle.length - 1])) {
      arrTitle.pop();
    }

    return arrTitle.join(' ');
  }

  private isNumeric(str) {
    return /^\d+$/.test(str);
  }

  private checkForAliases(title) {
    //todo - db or external file
    const aliases = [
      ['spider man', 'Spider Man'],
      ['spiderman', 'Spider Man'],
      ['spider-man', 'Spider Man'],
      ['madagascar', 'Madagascar'],
      ['ice age', 'Ice Age'],
      ['hotel transylvania', 'Hotel Transylvania'],
      ['despicable me', 'Despicable Me'],
      ['the matrix', 'The Matrix'],
      ['frozen', 'Frozen'],
      ['garfield', 'Garfield'],
      ['harry potter', 'Harry Potter'],
      ['fifty shades', 'Fifty Shades'],
      ['lilo', 'Lilo and Stitch'],
    ];

    for (let i = 0; i < aliases.length; i++) {
      const [pattern, alias] = aliases[i];
      if (title.toLowerCase().indexOf(pattern) > -1) {
        return alias;
      }
    }

    return title;
  }
}
