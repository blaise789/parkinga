import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LoginDTO } from './dto/login.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import ServerResponse from 'src/utils/ServerResponse';
import { ResetPasswordDTO } from './dto/password-reset.dto';
import { InitiatePasswordResetDTO } from './dto/initiate-pass-reset.dto';
import appConfig from 'src/config/app.config';

@Controller('auth')
@ApiTags('auth')
@ApiBearerAuth()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDTO) {
    const response = await this.authService.login(dto);
    return ServerResponse.success('Login successful', { ...response });
  }

  @Patch('initiate-reset-password')
  async initiateResetPassword(@Body() dto: InitiatePasswordResetDTO) {
    console.log(appConfig().client.url);

    await this.authService.initiatePasswordReset(dto);
    return ServerResponse.success(
      `Password reset link has been sent to ${dto.email}`,
    );
  }

  @Patch('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDTO) {
    await this.authService.resetPassword(dto);
    return ServerResponse.success('Password reset successfully');
  }
}
