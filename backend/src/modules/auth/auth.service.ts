import { HttpException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compareSync, hash } from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'prisma/prisma.service';
import ServerResponse from 'src/utils/ServerResponse';
import { UserService } from '../user/user.service';
import { LoginDTO } from './dto/login.dto';
import { ResetPasswordDTO } from './dto/password-reset.dto';
import { InitiatePasswordResetDTO } from './dto/initiate-pass-reset.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private mailService: MailService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async login(dto: LoginDTO) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) throw new HttpException('Invalid email or password', 400);
    const match = compareSync(dto.password, user.password);
    if (!match) throw new HttpException('Invalid email or password', 400);
    const token = this.jwtService.sign({ id: user.id });
    return { token, user };
  }
  async initiatePasswordReset(dto: InitiatePasswordResetDTO) {
    //    user Exists
    try {
      const user = await this.userExists(dto.email);
      console.log(user);
      if (!user) {
        throw new HttpException('invalid email address', 400);
      }
      if (user.passwordResetStatus === 'PENDING') {
        throw new HttpException('Password reset code already sent', 400);
      }
      const passwordResetCode = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          passwordResetCode,
          passwordResetExpires: new Date(Date.now() + 600000),
          passwordResetStatus: 'PENDING',
        },
      });
      await this.mailService.sendInitiatePasswordResetEmail({
        names: user.lastName,
        email: user.email,
        token: passwordResetCode,
      });
    } catch (err) {
      throw err;
    }
  }
  async userExists(email: string) {
    const user = await this.userService.findByEmail(email);
    return user;
  }
  async resetPassword(dto: ResetPasswordDTO) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          passwordResetCode: dto.resetToken,
        },
      });
      if (!user) throw new HttpException('invalid reset code', 400);
      // check expiration
      if (!user.passwordResetExpires || user.passwordResetExpires < new Date())
        throw new HttpException('invalid password reset token', 400);
      const hashedPassword = await hash(dto.password, 10);
      const updatedUser = await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: hashedPassword,
          passwordResetCode: null,
          passwordResetExpires: null,
          passwordResetStatus: 'IDLE',
        },
      });
      await this.mailService.sendPasswordResetSuccessfulEmail({
        email: updatedUser.email,
        names: updatedUser.firstName,
      });
    } catch (err) {
      throw err;
    }
  }
}
