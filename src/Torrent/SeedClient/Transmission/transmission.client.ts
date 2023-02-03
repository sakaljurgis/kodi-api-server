import { Injectable } from '@nestjs/common';
import * as Transmission from 'transmission';
import { VideoFilesConfig } from '../../../config/video-files.config';
import { configService } from '../../../config/config.service';
import { TorrentEntity } from '../../../Shared/Entity/torrent.entity';
import { TorrentInfo } from '../Dto/torrent-info.dto';
import { FileEntity } from '../../../Shared/Entity/file.entity';

@Injectable()
export class TransmissionClient {
  private transmission: Transmission;
  private config: VideoFilesConfig = configService.getVideoFilesConfig();

  constructor() {
    this.transmission = new Transmission(this.config.getTransmissionOptions());
  }

  addTorrent(torrentEntity: TorrentEntity): Promise<TorrentInfo> {
    return new Promise((resolve, reject) => {
      this.transmission.addUrl(
        torrentEntity.magnet,
        { 'download-dir': torrentEntity.path },
        (err, arg) => {
          if (err) {
            return reject(err);
          }

          const torrentInfo = new TorrentInfo();
          torrentInfo.id = arg.id;
          torrentInfo.linkomanija = torrentEntity.magnet
            .toLowerCase()
            .includes('linkomanija');

          return resolve(torrentInfo);
        },
      );
    });
  }

  findTorrentInfoByFile(fileEntity: FileEntity): Promise<TorrentInfo> {
    return new Promise((resolve, reject) => {
      this.transmission.get((err, result) => {
        if (err) {
          return reject(err);
        }

        for (const torr of result.torrents) {
          for (const file of torr.files) {
            if (fileEntity.path === torr.downloadDir + '/' + file.name) {
              const torrentInfo = new TorrentInfo();
              torrentInfo.id = torr.id;
              torrentInfo.linkomanija = torr.magnetLink
                .toLowerCase()
                .includes('linkomanija');

              return resolve(torrentInfo);
            }
          }
        }

        return reject('file not found');
      });
    });
  }

  removeTorrent(torrentEntity: TorrentEntity, removeData = false) {
    if (torrentEntity.transmissionId) {
      return new Promise((resolve, reject) => {
        this.transmission.remove(
          [torrentEntity.transmissionId],
          removeData,
          (e, r) => {
            if (e) {
              return reject(e);
            }

            return resolve(r);
          },
        );
      });
    }
  }
}
