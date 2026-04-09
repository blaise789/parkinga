// src/reservations/dto/create-reservation.dto.ts
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReservationStatus } from '@prisma/client';

export class CreateReservationDto {
  @ApiProperty({ description: 'ID of the vehicle', example: 1 })
  @IsInt()
  vehicleId: number;

  @ApiProperty({ description: 'ID of the parking slot' })
  @IsUUID()
  slotId: string;

  @ApiProperty({ description: 'Planned start time of the reservation', example: '2024-04-10T14:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: 'Planned end time of the reservation', example: '2024-04-10T16:00:00Z' })
  @IsDateString()
  endTime: string;

  @ApiProperty({ description: 'Special requests or notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateReservationStatusDto {
  @ApiProperty({
    enum: ReservationStatus,
    description: 'New status for the reservation',
  })
  @IsEnum(ReservationStatus)
  status: ReservationStatus;
}
