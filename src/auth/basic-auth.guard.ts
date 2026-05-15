import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Basic ')) {
      throw new UnauthorizedException('Basic authorization is required');
    }

    const credentials = this.decodeCredentials(authorization);
    const expectedUsername = this.configService.get<string>(
      'BASIC_AUTH_USERNAME',
    );
    const expectedPassword = this.configService.get<string>(
      'BASIC_AUTH_PASSWORD',
    );

    if (
      !expectedUsername ||
      !expectedPassword ||
      !credentials ||
      !this.safeCompare(credentials.username, expectedUsername) ||
      !this.safeCompare(credentials.password, expectedPassword)
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return true;
  }

  private decodeCredentials(
    authorization: string,
  ): { username: string; password: string } | null {
    const encodedCredentials = authorization.slice('Basic '.length).trim();
    const decodedCredentials = Buffer.from(
      encodedCredentials,
      'base64',
    ).toString('utf8');
    const separatorIndex = decodedCredentials.indexOf(':');

    if (separatorIndex < 0) {
      return null;
    }

    return {
      username: decodedCredentials.slice(0, separatorIndex),
      password: decodedCredentials.slice(separatorIndex + 1),
    };
  }

  private safeCompare(received: string, expected: string): boolean {
    const receivedBuffer = Buffer.from(received);
    const expectedBuffer = Buffer.from(expected);

    if (receivedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(receivedBuffer, expectedBuffer);
  }
}
