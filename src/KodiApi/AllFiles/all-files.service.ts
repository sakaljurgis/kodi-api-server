import { Injectable } from '@nestjs/common';
import ApiResponse from '../Dto/api-response.dto';
import { KodiApiResponseFactory } from '../kodi-api-response.factory';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TitleEntity } from './Entity/title.entity';
import { FileEntity } from './Entity/file.entity';
import { TitleTypeEnum } from './Enum/title-type.enum';

@Injectable()
export class AllFilesService {
  constructor(
    private readonly koiApiResponseFactory: KodiApiResponseFactory,
    @InjectRepository(TitleEntity)
    private titleRepository: Repository<TitleEntity>,
    @InjectRepository(FileEntity)
    private fileRepository: Repository<FileEntity>,
  ) {}

  getMenu(): ApiResponse {
    const apiResponse = this.koiApiResponseFactory.createApiResponse();
    apiResponse
      .createItem()
      .setLabel('Movies')
      .setPath('all/movie')
      .setToFolder();
    apiResponse
      .createItem()
      .setLabel('Shows')
      .setPath('all/show')
      .setToFolder();

    return apiResponse;
  }

  async getListOfTitles(type: TitleTypeEnum): Promise<ApiResponse> {
    const entities = await this.titleRepository
      .createQueryBuilder()
      .setFindOptions({ relations: { files: true } })
      .where('type = :type', { type: type })
      .andWhere('deleted = :deleted', { deleted: false })
      .getMany();

    const response = this.koiApiResponseFactory.createApiResponse();
    response.setTitle('All ' + type + 's');
    entities.forEach((entity) => {
      response
        .createItem()
        .setLabel(entity.title)
        .setToFolder()
        .setPlot(entity.files.length + ' files');
    });

    return response;
  }
}
