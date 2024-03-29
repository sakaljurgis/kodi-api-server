import { Injectable } from '@nestjs/common';
import * as tnp from 'torrent-name-parser';
import { FileEntityExpanderInterface } from './file-entity-expander.interface';
import { FileEntity } from 'src/Shared/Entity/file.entity';
import { VideoFilesUpdateRepository } from '../video-files-update.repository';
import { TitleTypeEnum } from '../../../Shared/Enum/title-type.enum';
import { JsonFileDataStorageService } from '../../../DataStorage/json-file-data-storage.service';

//todo - refactor this copy-paste, add types, ect.
@Injectable()
export class FileEntityTitleInfoExpander
  implements FileEntityExpanderInterface
{
  constructor(
    private readonly repository: VideoFilesUpdateRepository,
    private readonly jsonFileDataStorageService: JsonFileDataStorageService,
  ) {
    tnp.configure({ sample: /sample/i }, { sample: 'boolean' });
    tnp.configure({ year: /([\[\(]?((?:19[0-9][0-9]|20[0-2][0-9]))[\]\)]?)/ });
    tnp.configure({ container: /MKV|AVI|MP4|mkv|avi|mp4/i });
  }

  async expand(fileEntity: FileEntity): Promise<FileEntity> {
    const titleInfo = this.extractTitleInfo(fileEntity.relativePath);

    fileEntity.info = JSON.stringify(titleInfo.info);
    fileEntity.infos = JSON.stringify(titleInfo.infos);
    fileEntity.season = titleInfo.info.season;
    fileEntity.title = await this.repository.findOrCreateTitle(
      await this.checkForAliases(titleInfo.info.title),
      titleInfo.info.season ? TitleTypeEnum.show : TitleTypeEnum.movie,
    );

    return fileEntity;
  }

  extractTitleInfo(relativePath: string) {
    const infos = [];
    const arrPath = relativePath.split('/');

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

  /**
   * Check if title matches any of the aliases and return the alias if it does
   * @param title
   * @private
   */
  private async checkForAliases(title) {
    type Alias = [string, string];
    const aliases: Alias[] = await this.jsonFileDataStorageService.get<Alias[]>(
      'aliases',
      [],
    );

    for (let i = 0; i < aliases.length; i++) {
      const [pattern, alias] = aliases[i];
      if (title.toLowerCase().indexOf(pattern) > -1) {
        return alias;
      }
    }

    return title;
  }
}
