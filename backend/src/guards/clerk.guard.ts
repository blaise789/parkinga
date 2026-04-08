import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ClerkGuard implements CanActivate {
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
        const user = await this.prisma.user.findUnique({
          where: { id: decodedToken.id },
        });
        if (!user) return false;
        switch (user.role) {
          case 'CLERK':
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
