import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtUser } from '../strategies/jwt.strategy';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtUser | undefined, ctx: ExecutionContext): JwtUser | JwtUser[keyof JwtUser] => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtUser;
    return data ? user?.[data] : user;
  },
);
