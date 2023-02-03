import { Controller, Get, Head, Param, Req, Res } from '@nestjs/common';
import ApiResponse from '../Dto/api-response.dto';
import { AllFilesService } from './all-files.service';
import { Request, Response } from 'express';
import { TitleTypeEnum } from '../../Shared/Enum/title-type.enum';
import { KodiApiResponse } from '../Dto/kodi-api-response.type';
import NotificationResponse from '../Dto/notification-response.dto';

@Controller('api/all')
export class AllFilesController {
  constructor(private readonly allFilesService: AllFilesService) {}

  @Get()
  getMenu(): ApiResponse {
    return this.allFilesService.getMenu();
  }

  @Get('show')
  getShows(): Promise<ApiResponse> {
    return this.allFilesService.getListOfTitles(TitleTypeEnum.show);
  }

  @Get('movie')
  async getMovies(): Promise<ApiResponse> {
    return this.allFilesService.getListOfTitles(TitleTypeEnum.movie);
  }

  @Get('scan')
  scanNewFiles(): KodiApiResponse {
    return this.allFilesService.scanNewFiles();
  }

  @Get('delete/:fileId')
  async deleteFile(@Param('fileId') fileId: string): Promise<KodiApiResponse> {
    return this.allFilesService.deleteFile(fileId);
  }

  @Get('play/:fileId')
  @Head('play/:fileId')
  play(
    @Param('fileId') fileId: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    return this.allFilesService.play(fileId, request, response);
  }

  @Get(':titleId/:seasonId?')
  getTitle(
    @Param('titleId') titleId: string, //actually a number, how to cast?
    @Param('seasonId') seasonId: string, //actually a number, how to cast?
  ): Promise<KodiApiResponse> {
    return this.allFilesService.loadTitle(
      parseInt(titleId),
      parseInt(seasonId),
    );
  }
}
