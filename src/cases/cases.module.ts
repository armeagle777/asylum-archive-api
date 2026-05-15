import { Module } from '@nestjs/common';
import { BasicAuthGuard } from '../auth/basic-auth.guard';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';

@Module({
  controllers: [CasesController],
  providers: [BasicAuthGuard, CasesService],
})
export class CasesModule {}
