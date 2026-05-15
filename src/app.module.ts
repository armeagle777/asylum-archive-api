import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CasesModule } from './cases/cases.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    CasesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
