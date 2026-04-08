// src/reservations/dto/create-reservation.dto.ts
import { IsDateString, IsEnum, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReservationStatus } from '@prisma/client';

export class CreateReservationDto {
  @ApiProperty({ description: 'ID of the vehicle', example: 1 })
  @IsInt()
  vehicleId: number;
}
export class UpdateReservationStatusDto {
  @ApiProperty({
    enum: ReservationStatus,
    description: 'New status for the reservation',
  })
  @IsEnum(ReservationStatus)
  status: ReservationStatus;
}
