import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token tidak ditemukan');
    }

    const token = authHeader.split(' ')[1];

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      
      if (!secret) {
        throw new Error('JWT_SECRET tidak dikonfigurasi');
      }

      const decoded = jwt.verify(token, secret);
      
      request.user = decoded;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Token tidak valid atau kadaluwarsa');
    }
  }
}