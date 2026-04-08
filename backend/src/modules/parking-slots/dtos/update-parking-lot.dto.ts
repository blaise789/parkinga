import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ParkingLocation,
  SlotStatus,
  VehicleSize,
  VehicleType,
} from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateParkingSlotDto {
  @ApiPropertyOptional({
    description: 'Unique identifier for the parking slot',
    example: 'A-101',
  })
  @IsString()
  @IsOptional()
  slotNumber?: string;

  @ApiPropertyOptional({
    description: 'Size category of the parking slot',
    enum: VehicleSize,
    example: VehicleSize.MEDIUM,
  })
  @IsEnum(VehicleSize)
  @IsOptional()
  size?: VehicleSize;

  @ApiPropertyOptional({
    description: 'Type of vehicle this slot accommodates',
    enum: VehicleType,
    example: VehicleType.CAR,
  })
  @IsEnum(VehicleType)
  @IsOptional()
  vehicleType?: VehicleType;

  @ApiPropertyOptional({
    description: 'Physical location of the parking slot within the facility',
    enum: ParkingLocation,
    example: ParkingLocation.NORTH,
  })
  @IsEnum(ParkingLocation)
  @IsOptional()
  location?: ParkingLocation;

  @ApiPropertyOptional({
    description: 'Current availability status of the slot',
    enum: SlotStatus,
    example: SlotStatus.AVAILABLE,
  })
  @IsEnum(SlotStatus)
  @IsOptional()
  status?: SlotStatus;
}
