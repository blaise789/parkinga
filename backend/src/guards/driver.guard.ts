import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class DriverGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization;
    if (token && token.startsWith('Bearer ')) {
      const tokenValue = token.split(' ')[1];
      try {
        const decodedToken = this.jwtService.verify(tokenValue);
        console.log(decodedToken);
        const user = await this.prisma.user.findUnique({
          where: { id: decodedToken.id },
        });
        console.log(user);
        if (!user) return false;
        switch (user.role) {
          case 'DRIVER':
            request.user = decodedToken;
            return true;
          default:
            return false;
        }
      } catch (error) {
        return false;
      }
    }
    return false;
  }
}
