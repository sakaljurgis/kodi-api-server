import { Injectable } from '@nestjs/common';
import * as WebTorrent from 'webtorrent';
import { Instance, Torrent, TorrentFile, TorrentOptions } from 'webtorrent';
import { InjectRepository } from '@nestjs/typeorm';
import { TorrentEntity } from '../../../Shared/Entity/torrent.entity';
import { Repository } from 'typeorm';
import { configService } from '../../../config/config.service';
import { extname, join } from 'path';
import { FileEntity } from '../../../Shared/Entity/file.entity';
import { StreamProviderEnum } from '../../../Shared/Enum/stream-provider.enum';
import { VideoFilesFacade } from '../../../VideoFiles/video-files.facade';
import { TorrentSeedClient } from '../../SeedClient/torrent-seed.client';

@Injectable()
export class WebtorrentClient {
  private client: Instance;
  private readonly torrentOptions: TorrentOptions;
  private readonly configService = configService.getVideoFilesConfig();

  constructor(
    @InjectRepository(TorrentEntity)
    private readonly torrentRepository: Repository<TorrentEntity>,
    private readonly videoFilesFacade: VideoFilesFacade,
    @InjectRepository(FileEntity)
    private readonly filesRepository: Repository<FileEntity>,
    private readonly seedClient: TorrentSeedClient,
  ) {
    this.client = new WebTorrent();

    this.torrentOptions = {};
    this.torrentOptions.path = this.configService.getTorrentDownloadDir();
    this.torrentOptions.getAnnounceOpts = function() {
      const that = this as Torrent;

      return {
        uploaded: 0, //this.uploaded,
        downloaded: 0, //this.downloaded,
        left: that.length, //Math.max(this.length - this.downloaded, 0)
      };
    };

    this.resumeNotStopped();
  }

  resumeNotStopped(): void {
    this.torrentRepository
      .find({
        where: { stopped: false },
      })
      .then((torrentEntities) => {
        for (const torrentEntity of torrentEntities) {
          this.addTorrent(torrentEntity.magnet).then();
        }
      });
  }

  async addTorrent(magnet: string): Promise<FileEntity[]> {
    let torrentEntity = await this.torrentRepository
      .findOne({
        where: { magnet: magnet },
        relations: { files: { torrent: true } },
      })
      .catch(() => null);

    if (torrentEntity && torrentEntity.infoHash) {
      //if stopped and complete - return immediately
      if (torrentEntity.stopped && torrentEntity.progress === 1) {
        return torrentEntity.files;
      }
      //if already in wt - return files, if not continue as always
      const torrent = this.client.get(torrentEntity.infoHash);
      if (torrent) {
        return torrentEntity.files;
      }
    }

    if (torrentEntity === null) {
      torrentEntity = new TorrentEntity();
      torrentEntity.magnet = magnet;

      await this.torrentRepository.save(torrentEntity);
      torrentEntity = await this.torrentRepository
        .findOneByOrFail({ magnet: magnet })
        .catch(() => null);
    }

    const torrent = await this.addTorrentReturnOnReady(torrentEntity);

    this.mapTorrentToEntity(torrentEntity, torrent);

    await this.torrentRepository.save(torrentEntity);

    if (torrent.done && torrentEntity.files) {
      //in case we added already downloaded one
      this.registerDone(torrent);
      return torrentEntity.files;
    }

    const partialFileEntities = this.buildPartialVideoFileEntities(
      torrentEntity,
      torrent,
    );

    const fileEntities = await this.videoFilesFacade.addVideoFiles(
      partialFileEntities,
    );

    this.registerProgressSave(torrent);
    this.registerDone(torrent);

    return fileEntities;
  }

  private async addTorrentReturnOnReady(
    torrentEntity: TorrentEntity,
  ): Promise<Torrent> {
    let torrent = null;
    if (torrentEntity.infoHash) {
      torrent = this.client.get(torrentEntity.infoHash) as Torrent | undefined;
    }

    if (!torrent) {
      return new Promise((resolve, reject) => {
        const torrent = this.client.add(
          torrentEntity.magnet,
          this.torrentOptions,
        );

        torrent.on('ready', () => {
          resolve(torrent);
        });

        torrent.on('error', () => {
          reject('torrent error');
        });
      });
    }

    return Promise.resolve(torrent);
  }

  private registerProgressSave(torrent: Torrent) {
    const notOftenThan = 1000 * 5;
    let lastUpdateTime = 0;

    torrent.on('download', async () => {
      if (lastUpdateTime < Date.now() - notOftenThan) {
        await this.torrentRepository.update(
          { infoHash: torrent.infoHash },
          { progress: torrent.progress },
        );
        for (const file of torrent.files) {
          await this.filesRepository.update(
            { relativePath: file.path },
            { progress: file.progress },
          );
        }
        lastUpdateTime = Date.now();
      }
    });
  }

  private registerDone(torrent: Torrent) {
    if (torrent.done) {
      this.actWhenDone(torrent);
      return;
    }

    torrent.on('done', () => {
      this.actWhenDone(torrent);
    });
  }

  private actWhenDone(torrent: Torrent) {
    this.torrentRepository
      .update({ infoHash: torrent.infoHash }, { progress: 1, stopped: true })
      .then(async () => {
        const torrentEntity = await this.torrentRepository.findOne({
          where: { infoHash: torrent.infoHash },
          relations: { files: { torrent: true } },
        });

        //update files to progress 1
        await this.filesRepository.update(
          { torrentId: torrentEntity.id },
          { progress: 1 },
        );

        return torrentEntity;
      })
      .then(async (torrentEntity) => {
        //move file to seeding
        if (torrentEntity.magnet.toLowerCase().includes('linkomanija')) {
          const torrentInfo = await this.seedClient
            .addTorrent(torrentEntity)
            .catch(() => null);
          if (torrentInfo) {
            torrentEntity.transmissionId = parseInt(torrentInfo.id);
            await this.torrentRepository.save(torrentEntity);
          }
        }

        return torrentEntity;
      })
      .then(async (torrentEntity) => {
        //update files info with expanders and move to fs provider
        const filePaths: string[] = [];
        for (const file of torrentEntity.files) {
          filePaths.push(file.path);
        }
        this.videoFilesFacade.updateEntitiesByPath(filePaths).then();
        torrent.destroy();

        return torrentEntity;
      });
  }

  private mapTorrentToEntity(torrentEntity: TorrentEntity, torrent: Torrent) {
    torrentEntity.path = torrent.path;
    torrentEntity.infoHash = torrent.infoHash;
    torrentEntity.name = torrent.name;
    torrentEntity.stopped = torrent.progress === 1;
    torrentEntity.progress = torrent.progress;
    torrentEntity.size = torrent.length;
    torrentEntity.linkomanija = torrentEntity.magnet
      .toLowerCase()
      .includes('linkomanija');

    //map all files (include not video files, will be needed for deletion)
    torrentEntity.info = JSON.stringify({
      files: torrent.files.map((file) => {
        return { path: join(torrent.path, file.path) };
      }),
    });
  }

  private buildPartialVideoFileEntities(
    torrentEntity: TorrentEntity,
    torrent: Torrent,
  ): Partial<FileEntity>[] {
    return torrent.files.reduce(
      (filtered: Partial<FileEntity>[], file: TorrentFile) => {
        if (
          this.configService
            .getVideoFilesExt()
            .indexOf(extname(file.name).toLowerCase()) > -1
        ) {
          const partialFileEntity: Partial<FileEntity> = {
            path: join(torrent.path, file.path),
            relativePath: file.path,
            torrent: torrentEntity,
            size: file.length,
            streamProvider: StreamProviderEnum.wt,
            fileName: file.name,
            linkomanija: torrentEntity.magnet
              .toLowerCase()
              .includes('linkomanija'),
          };
          filtered.push(partialFileEntity);
        }

        return filtered;
      },
      [],
    );
  }

  getTorrentByInfoHash(torrentInfoHash: string): Torrent | void {
    return this.client.get(torrentInfoHash);
  }

  async stopTorrent(torrentId: number): Promise<void> {
    const torrentEntity = await this.torrentRepository.findOne({
      where: { id: torrentId },
    });

    if (!torrentEntity || !torrentEntity.infoHash) {
      return;
    }

    const torrent = await this.getTorrentByInfoHash(torrentEntity.infoHash);

    if (!torrent || torrent.done) {
      return;
    }

    return new Promise((resolve, reject) => {
      torrent.destroy({ destroyStore: false }, (e) => {
        if (e) {
          return reject(e);
        }
        torrentEntity.stopped = true;
        this.torrentRepository.save(torrentEntity);

        return resolve();
      });
    });
  }
}
