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

  @Get('scan-all')
  scanAllFiles(): KodiApiResponse {
    return this.allFilesService.scanAllFiles();
  }

  @Get('delete/:fileId')
  async deleteFile(@Param('fileId') fileId: string): Promise<KodiApiResponse> {
    return this.allFilesService.deleteFile(fileId);
  }

  @Get('continue')
  getContinueWatching(): Promise<ApiResponse> {
    return this.allFilesService.getContinueWatching();
  }

  @Get('watched/:fileId')
  markWatched(@Param('fileId') fileId: string): Promise<KodiApiResponse> {
    return this.allFilesService.setWatched(fileId, true);
  }

  @Get('unwatched/:fileId')
  markUnwatched(@Param('fileId') fileId: string): Promise<KodiApiResponse> {
    return this.allFilesService.setWatched(fileId, false);
  }

  @Get('watched-title/:titleId/:seasonId?')
  markTitleWatched(
    @Param('titleId') titleId: string,
    @Param('seasonId') seasonId: string,
  ): Promise<KodiApiResponse> {
    return this.allFilesService.setTitleWatched(
      parseInt(titleId),
      parseInt(seasonId),
      true,
    );
  }

  @Get('unwatched-title/:titleId/:seasonId?')
  markTitleUnwatched(
    @Param('titleId') titleId: string,
    @Param('seasonId') seasonId: string,
  ): Promise<KodiApiResponse> {
    return this.allFilesService.setTitleWatched(
      parseInt(titleId),
      parseInt(seasonId),
      false,
    );
  }

  @Get('hide/:fileId')
  hideFromContinueWatching(
    @Param('fileId') fileId: string,
  ): Promise<KodiApiResponse> {
    return this.allFilesService.hideFromContinueWatching(fileId);
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
