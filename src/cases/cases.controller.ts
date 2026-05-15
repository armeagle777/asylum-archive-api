import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { BasicAuthGuard } from '../auth/basic-auth.guard';
import { GetCaseParamsDto } from './dto/get-case-params.dto';
import { SearchCasesQueryDto } from './dto/search-cases-query.dto';
import { CasesService } from './cases.service';

@Controller('cases')
@UseGuards(BasicAuthGuard)
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get('search')
  searchCases(@Query() query: SearchCasesQueryDto) {
    return this.casesService.searchCases(query);
  }

  @Get(':caseId')
  getCaseDetails(@Param() params: GetCaseParamsDto) {
    return this.casesService.getCaseDetails(params.caseId);
  }
}
