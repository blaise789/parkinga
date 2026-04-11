import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class WalkInDto {
  @ApiProperty({ description: 'ID of the user (Driver)' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'ID of the vehicle' })
  @IsInt()
  vehicleId: number;

  @ApiProperty({ description: 'ID of the parking slot assigned' })
  @IsUUID()
  slotId: string;

  @ApiPropertyOptional({ description: 'Any notes by the clerk' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Pre-paid hours if using upfront payment' })
  @IsInt()
  @IsOptional()
  prepaidHours?: number;
}
