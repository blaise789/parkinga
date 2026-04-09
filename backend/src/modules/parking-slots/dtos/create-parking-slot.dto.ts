// parking-lots/dto/create-parking-lot.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  ParkingLocation,
  SlotStatus,
  VehicleSize,
  VehicleType,
} from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateParkingSlotDto {
  @ApiProperty({
    description: 'Unique identifier for the parking slot',
    example: 'A-101',
    required: true,
  })
  @IsString()
  slotNumber: string;

  @ApiProperty({
    description: 'Size category of the parking slot',
    enum: VehicleSize,
    example: VehicleSize.MEDIUM,
    required: true,
  })
  @IsEnum(VehicleSize)
  size: VehicleSize;

  @ApiProperty({
    description: 'Type of vehicle this slot accommodates',
    enum: VehicleType,
    example: VehicleType.CAR,
    required: true,
  })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiProperty({
    description: 'Physical location of the parking slot within the facility',
    enum: ParkingLocation,
    example: ParkingLocation.NORTH,
    required: true,
  })
  @IsEnum(ParkingLocation)
  location: ParkingLocation;
  @IsEnum(SlotStatus)
  @ApiProperty({
    description: 'Status of the parking slot',
    enum: SlotStatus,
    example: SlotStatus.AVAILABLE,
    required: true,
  })
  status: SlotStatus;

  @ApiProperty({
    description: 'Hourly rate for the parking slot',
    example: 2.50,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  hourlyRate?: number;
}
