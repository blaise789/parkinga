// parking-lots/dto/bulk-create-parking-slot.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  ParkingLocation,
  SlotStatus,
  VehicleSize,
  VehicleType,
} from '@prisma/client';
import { IsEnum, IsInt, IsOptional, Min, Max } from 'class-validator';

export class BulkCreateParkingSlotDto {
  @ApiProperty({
    description: 'Number of slots to create',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  count: number;

  @ApiProperty({
    description: 'Type of vehicle for all slots',
    enum: VehicleType,
    example: VehicleType.CAR,
  })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiProperty({
    description: 'Size for all slots',
    enum: VehicleSize,
    example: VehicleSize.MEDIUM,
  })
  @IsEnum(VehicleSize)
  size: VehicleSize;

  @ApiProperty({
    description: 'Location for all slots',
    enum: ParkingLocation,
    example: ParkingLocation.NORTH,
  })
  @IsEnum(ParkingLocation)
  location: ParkingLocation;

  @ApiProperty({
    description: 'Initial status for all slots',
    enum: SlotStatus,
    example: SlotStatus.AVAILABLE,
    required: false,
  })
  @IsEnum(SlotStatus)
  @IsOptional()
  status?: SlotStatus = SlotStatus.AVAILABLE;
}
