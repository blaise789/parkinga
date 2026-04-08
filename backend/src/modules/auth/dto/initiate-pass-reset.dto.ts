import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class InitiatePasswordResetDTO {
  @IsEmail()
  @ApiProperty()
  email: string;
}
