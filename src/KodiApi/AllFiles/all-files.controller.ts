import { Controller, Get, Param } from '@nestjs/common';
import ApiResponse from '../Dto/api-response.dto';
import { AllFilesService } from './all-files.service';
import { TitleTypeEnum } from './Enum/title-type.enum';

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

  @Get('play/:fileId')
  play(@Param('fileId') fileId: string) {
    return { will: 'return a playable stream of ' + fileId };
  }

  @Get(':titleId/:seasonId?')
  getTitle(
    @Param('titleId') titleId: string, //actually a number, how to cast?
    @Param('seasonId') seasonId: string, //actually a number, how to cast?
  ): Promise<ApiResponse> {
    return this.allFilesService.loadTitle(
      parseInt(titleId),
      parseInt(seasonId),
    );
  }
}
