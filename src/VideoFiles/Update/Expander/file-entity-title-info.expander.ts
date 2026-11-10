import { Injectable } from '@nestjs/common';
import { FileEntityExpanderInterface } from './file-entity-expander.interface';
import { FileEntity } from '../../../Shared/Entity/file.entity';
import { VideoFilesUpdateRepository } from '../video-files-update.repository';
import { parseRelativePath } from '../TitleParser/title-parser';
import { TitleRulesService } from '../../TitleRules/title-rules.service';

/**
 * Title and season from the relative path, changed by the title rules.
 * `info`/`infos` keep what the parser found.
 */
@Injectable()
export class FileEntityTitleInfoExpander
  implements FileEntityExpanderInterface
{
  constructor(
    private readonly repository: VideoFilesUpdateRepository,
    private readonly titleRulesService: TitleRulesService,
  ) {}

  async expand(fileEntity: FileEntity): Promise<FileEntity> {
    const parsed = parseRelativePath(fileEntity.relativePath);
    const resolved = await this.titleRulesService.resolve(
      fileEntity.relativePath,
      parsed.info,
    );

    fileEntity.info = JSON.stringify(parsed.info);
    fileEntity.infos = JSON.stringify(parsed.infos);
    // null, not undefined: saving skips undefined, the old season would stay
    fileEntity.season = resolved.season ?? null;
    fileEntity.title = await this.repository.findOrCreateTitle(
      resolved.title,
      resolved.type,
      resolved.exactTitle,
    );
    fileEntity.titleId = fileEntity.title.id;

    return fileEntity;
  }
}
