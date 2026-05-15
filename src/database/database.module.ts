import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Sequelize } from 'sequelize';
import { SEQUELIZE } from './database.constants';

@Global()
@Module({
  providers: [
    {
      provide: SEQUELIZE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new Sequelize({
          dialect: 'mysql',
          host: configService.getOrThrow<string>('DB_HOST'),
          port: Number(configService.get<string>('DB_PORT') ?? 3306),
          database: configService.getOrThrow<string>('DB_NAME'),
          username: configService.getOrThrow<string>('DB_USERNAME'),
          password: configService.getOrThrow<string>('DB_PASSWORD'),
          logging: configService.get<string>('DB_LOGGING') === 'true',
          pool: {
            max: Number(configService.get<string>('DB_POOL_MAX') ?? 5),
            min: Number(configService.get<string>('DB_POOL_MIN') ?? 0),
            acquire: Number(
              configService.get<string>('DB_POOL_ACQUIRE_MS') ?? 30000,
            ),
            idle: Number(configService.get<string>('DB_POOL_IDLE_MS') ?? 10000),
          },
        }),
    },
  ],
  exports: [SEQUELIZE],
})
export class DatabaseModule {}
