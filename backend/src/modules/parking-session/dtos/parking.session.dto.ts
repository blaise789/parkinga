import { ApiProperty } from '@nestjs/swagger';
import {
  ParkingSlot,
  PaymentMethod,
  PaymentStatus,
  User,
} from '@prisma/client';

export class CreateSessionDto {
  @ApiProperty({ description: 'Vehicle plate number', example: 'ABC123' })
  plateNumber: string;
}

export class ExitParkingDto {
  @ApiProperty({ description: 'Exit time', type: Date, required: false })
  exitTime?: Date;
}

export class SessionResponseDto {
  @ApiProperty({ description: 'Session ID' })
  id: string;

  @ApiProperty({ description: 'Plate number' })
  plateNumber: string;

  @ApiProperty({ description: 'Entry time' })
  entryTime: Date;

  @ApiProperty({ description: 'Exit time', required: false })
  exitTime?: Date;

  @ApiProperty({ enum: PaymentStatus, description: 'Payment status' })
  paymentStatus: PaymentStatus;

  @ApiProperty({ description: 'Is exited flag' })
  isExited: boolean;

  @ApiProperty({ description: 'Slot information', type: Object })
  slot: {
    id: string;
    number: string;
  };

  @ApiProperty({
    description: 'Payment information',
    type: Object,
    required: false,
  })
  payment?: {
    amount: number;
    method: PaymentMethod;
  };
}

export class SessionFeeResponseDto {
  @ApiProperty({ description: 'Session ID' })
  session: string;

  @ApiProperty({ description: 'Entry time' })
  entryTime: Date;

  @ApiProperty({ description: 'Parking slot number' })
  parkingSlot: string;

  @ApiProperty({ description: 'User full name' })
  user: string;

  @ApiProperty({ description: 'Vehicle plate number' })
  vehicle_plate_number: string;

  @ApiProperty({ description: 'Parking hours' })
  parking_hours: number;

  @ApiProperty({ description: 'Calculated fee' })
  fee: number;
}
