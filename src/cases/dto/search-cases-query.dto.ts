import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class SearchCasesQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  contactTel?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  mulNum?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  middleName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  citizenship?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  docNum?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  pnum?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  cardNumber?: string;

  @Transform(({ value }) => (value === undefined ? 50 : Number(value)))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;

  @Transform(({ value }) => (value === undefined ? 0 : Number(value)))
  @IsInt()
  @Min(0)
  offset = 0;
}
