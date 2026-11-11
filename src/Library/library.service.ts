import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { FileEntity } from '../Shared/Entity/file.entity';
import { TitleEntity } from '../Shared/Entity/title.entity';
import { TitleRulesService } from '../VideoFiles/TitleRules/title-rules.service';
import { TitleRule } from '../VideoFiles/TitleRules/title-rule';
import { VideoFilesFacade } from '../VideoFiles/video-files.facade';
import { getEpisode, isSample } from '../Shared/Util/file-order';
import { ArtworkService } from '../Artwork/artwork.service';
import { getMovieQuery, getTitleQuery } from '../Artwork/artwork-query';
import { imageUrl } from '../Artwork/artwork-index';
import { ArtworkEntity } from '../Shared/Entity/artwork.entity';
import { TitleTypeEnum } from '../Shared/Enum/title-type.enum';

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
    private readonly artworkService: ArtworkService,
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
        infos: true,
        fileName: true,
        hidden: true,
        deleted: true,
      },
      where: { deleted: false, relativePath: Not(IsNull()) },
    });
    const titleIds = new Set(files.map((file) => file.titleId));
    const titles = (
      await this.titleRepository.find({
        select: { id: true, title: true, type: true },
      })
    ).filter((title) => titleIds.has(title.id));

    // artwork: a title's (its first film for movies), then each film's
    const titleFiles = new Map<number, FileEntity[]>();
    for (const file of files) {
      titleFiles.set(file.titleId, [
        ...(titleFiles.get(file.titleId) ?? []),
        file,
      ]);
    }
    const titleById = new Map(titles.map((title) => [title.id, title]));
    const fileArtwork = new Map<number, string>();
    for (const file of files) {
      const title = titleById.get(file.titleId);
      if (title?.type === TitleTypeEnum.movie && !isSample(file)) {
        fileArtwork.set(file.id, getMovieQuery(file, title).key);
      }
    }
    const artwork = new Map(
      (await this.artworkService.getAll()).map((row) => [row.key, row]),
    );

    return {
      titles: titles.map((title) => {
        const keys = [
          getTitleQuery(title, titleFiles.get(title.id) ?? [])?.key,
          ...(titleFiles.get(title.id) ?? []).map((file) =>
            fileArtwork.get(file.id),
          ),
        ];
        return { ...title, artwork: [...new Set(keys.filter(Boolean))] };
      }),
      files: files.map((file) => ({
        id: file.id,
        titleId: file.titleId,
        path: file.relativePath,
        season: file.season,
        episode: getEpisode(file),
        hidden: file.hidden,
        artwork: fileArtwork.get(file.id),
      })),
      rules: await this.titleRulesService.getRules(),
      artwork: Object.fromEntries(
        [...artwork].map(([key, row]) => [key, this.describeArtwork(row)]),
      ),
    };
  }

  /** what the page shows of a match */
  private describeArtwork(row: ArtworkEntity) {
    return {
      id: row.id,
      type: row.type,
      query: row.query,
      year: row.year,
      tmdbId: row.tmdbId,
      tmdbTitle: row.tmdbTitle,
      tmdbYear: row.tmdbYear,
      poster: imageUrl(row.poster, 'w154'),
      link: row.tmdbId
        ? `https://www.themoviedb.org/${
            row.type === TitleTypeEnum.movie ? 'movie' : 'tv'
          }/${row.tmdbId}`
        : undefined,
      manual: row.manual,
      fetchedAt: row.fetchedAt,
    };
  }

  /** a TMDB id or link, or null for no artwork */
  async setArtwork(id: number, tmdb: unknown) {
    return this.describeArtwork(await this.artworkService.setMatch(id, tmdb));
  }

  /** searched again, automatically */
  async resetArtwork(id: number) {
    await this.artworkService.resetMatch(id);
    return {};
  }

  /** every automatic match searched again */
  async refetchArtwork() {
    await this.artworkService.refetch();
    return {};
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
