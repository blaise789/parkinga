import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ResetPasswordDTO {
  @IsString()
  @ApiProperty()
  resetToken: string;
  @IsString()
  @ApiProperty()
  email: string;
  @IsString()
  @ApiProperty()
  password: string;
}
