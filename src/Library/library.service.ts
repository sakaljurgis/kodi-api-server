import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { FileEntity } from '../Shared/Entity/file.entity';
import { TitleEntity } from '../Shared/Entity/title.entity';
import { TitleRulesService } from '../VideoFiles/TitleRules/title-rules.service';
import { TitleRule } from '../VideoFiles/TitleRules/title-rule';
import { VideoFilesFacade } from '../VideoFiles/video-files.facade';
import { getEpisode } from '../Shared/Util/file-order';

/** the /library page: titles, their files and the title rules */
@Injectable()
export class LibraryService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    @InjectRepository(TitleEntity)
    private readonly titleRepository: Repository<TitleEntity>,
    private readonly titleRulesService: TitleRulesService,
    private readonly videoFilesFacade: VideoFilesFacade,
  ) {}

  /** titles that have files (not deleted), hidden ones too */
  async getData() {
    const files = await this.fileRepository.find({
      select: {
        id: true,
        titleId: true,
        relativePath: true,
        season: true,
        info: true,
        hidden: true,
      },
      where: { deleted: false, relativePath: Not(IsNull()) },
    });
    const titleIds = new Set(files.map((file) => file.titleId));
    const titles = (
      await this.titleRepository.find({
        select: { id: true, title: true, type: true },
      })
    ).filter((title) => titleIds.has(title.id));

    return {
      titles,
      files: files.map((file) => ({
        id: file.id,
        titleId: file.titleId,
        path: file.relativePath,
        season: file.season,
        episode: getEpisode(file),
        hidden: file.hidden,
      })),
      rules: await this.titleRulesService.getRules(),
    };
  }

  async saveRule(rule: Partial<TitleRule>) {
    const rules = await this.titleRulesService.saveRule(rule);
    return { rules, changed: await this.videoFilesFacade.reparseTitles() };
  }

  async deleteRule(id: string) {
    const rules = await this.titleRulesService.deleteRule(id);
    return { rules, changed: await this.videoFilesFacade.reparseTitles() };
  }

  /** hides files from the lists or shows them again (a folder: all its files) */
  async setHidden(fileIds: unknown, hidden: unknown) {
    if (
      !Array.isArray(fileIds) ||
      !fileIds.every((id) => Number.isInteger(id)) ||
      typeof hidden !== 'boolean'
    ) {
      throw new BadRequestException('fileIds (numbers) and hidden (boolean)');
    }

    return { changed: await this.videoFilesFacade.setHidden(fileIds, hidden) };
  }

  async reparse() {
    return { changed: await this.videoFilesFacade.reparseTitles() };
  }
}
