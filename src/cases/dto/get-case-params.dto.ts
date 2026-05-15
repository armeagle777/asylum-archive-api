import { Transform } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class GetCaseParamsDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  caseId: number;
}
