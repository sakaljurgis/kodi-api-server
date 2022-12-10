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

  @Get('play')
  play() {
    return { will: 'return a playable stream' };
  }

  @Get(':titleId/:seasonId?')
  getTitle(
    @Param('titleId') titleId: number,
    @Param('seasonId') seasonId: number,
  ) {
    return {
      will: 'show title videos list title ' + titleId + ', season ' + seasonId,
    };
  }
}
