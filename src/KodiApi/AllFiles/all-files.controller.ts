import { Controller, Get, Param } from '@nestjs/common';
import ApiResponse from '../Dto/api-response.dto';
import { AllFilesService } from './all-files.service';

@Controller('api/all')
export class AllFilesController {
  constructor(private readonly allFilesService: AllFilesService) {}

  @Get()
  getMenu(): ApiResponse {
    return this.allFilesService.getMenu();
  }

  @Get('show')
  getShows() {
    return { will: 'show shows list' };
  }

  @Get('movie')
  getMovies() {
    return { will: 'show movies list' };
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
