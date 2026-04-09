import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ReservationStatus,
  SlotStatus,
  VehicleSize,
  VehicleType,
} from '@prisma/client';
import { CreateReservationDto } from './dtos/reservation.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  private async validateVehicleOwnership(userId: string, vehicleId: number) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { userId: true },
    });

    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.userId !== userId)
      throw new ForbiddenException('Vehicle does not belong to you');
  }

  private async checkExistingReservation(vehicleId: number, startTime: Date, endTime: Date) {
    const existing = await this.prisma.reservation.findFirst({
      where: {
        vehicleId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime }
          }
        ]
      },
    });
    if (existing)
      throw new ConflictException(
        `Active reservation exists for this vehicle during this time (status: ${existing.status})`,
      );
  }

  async create(userId: string, dto: CreateReservationDto) {
    const { vehicleId, slotId, startTime: start, endTime: end, notes } = dto;
    const startTime = new Date(start);
    const endTime = new Date(end);

    if (startTime >= endTime) {
      throw new BadRequestException('startTime must be before endTime');
    }

    await this.validateVehicleOwnership(userId, vehicleId);
    await this.checkExistingReservation(vehicleId, startTime, endTime);

    // Check if slot exists
    const slot = await this.prisma.parkingSlot.findUnique({ where: { id: slotId } });
    if (!slot) throw new NotFoundException('Slot not found');

    // Prevent slot double booking
    const overlap = await this.prisma.reservation.findFirst({
      where: {
        slotId: slotId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime }
          }
        ]
      }
    });

    if (overlap) {
      throw new ConflictException('Slot is already reserved for this time period');
    }

    const expiration = new Date(startTime.getTime() + 30 * 60000); // 30 minutes expiration buffer

    return this.prisma.reservation.create({
      data: { 
        status: 'PENDING', 
        userId, 
        vehicleId, 
        slotId,
        startTime,
        endTime,
        expiration,
        notes
      },
      include: { vehicle: true, user: true, parkingSlot: true },
    });
  }

  async findAvailableSlots(vehicleType: VehicleType, size: VehicleSize) {
    return this.prisma.parkingSlot.findMany({
      where: { status: 'AVAILABLE', vehicleType, size },
    });
  }

  async deleteReservation(userId: string, id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });

    if (!reservation || reservation.userId !== userId) {
      throw new ForbiddenException('Reservation not found or unauthorized');
    }

    if (!['PENDING', 'REJECTED'].includes(reservation.status)) {
      throw new BadRequestException(
        'Only pending/rejected reservations can be deleted',
      );
    }

    return this.prisma.reservation.delete({ where: { id } });
  }

  // Stubs for remaining methods
  // async updateReservation(
  //   userId: string,
  //   id: string,
  //   updateDto: ,
  // ) {
  //   const { vehicleId } = updateDto;

  //   const reservation = await this.prisma.reservation.findUnique({
  //     where: { id },
  //     select: { userId: true, status: true },
  //   });

  //   if (!reservation || reservation.userId !== userId) {
  //     throw new ForbiddenException('Reservation not found or unauthorized');
  //   }

  //   if (reservation.status !== 'PENDING') {
  //     throw new BadRequestException('Only pending reservations can be updated');
  //   }

  //   if (vehicleId) {
  //     await this.validateVehicleOwnership(userId, vehicleId);
  //     await this.checkExistingReservation(vehicleId);
  //   }

  //   return this.prisma.reservation.update({
  //     where: { id },
  //     data: { vehicleId: vehicleId || undefined },
  //   });
  // }

  async approveReservation(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { vehicle: true, user: true, parkingSlot: true },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.status !== 'PENDING') {
      throw new BadRequestException(
        'Only pending reservations can be approved',
      );
    }

    // Send approval email
    await this.mailService.sendReservationApproval(
      reservation.user.email,
      reservation.parkingSlot.slotNumber,
      reservation.vehicle,
      reservation.parkingSlot.location,
    );

    return this.prisma.reservation.update({
      where: { id },
      data: {
        status: 'APPROVED'
      },
      include: { parkingSlot: true }
    });
  }

  async rejectReservation(id: string, reason?: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { vehicle: true, user: true, parkingSlot: true },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.status !== 'PENDING') {
      throw new BadRequestException(
        'Only pending reservations can be rejected',
      );
    }

    // Send rejection email
    await this.mailService.sendReservationRejection(
      reservation.user.email,
      reservation.vehicle,
      reason || 'Reservation rejected. Please try again later.',
      reservation.parkingSlot?.location,
    );

    return this.prisma.reservation.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }

  async findReservationById(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        vehicle: true,
        parkingSlot: true,
        user: { select: { id: true, email: true, firstName: true } },
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  async findReservations(userId: string) {
    try {
      const reservations = await this.prisma.reservation.findMany({
        where: { userId },
        include: {
          vehicle: { select: { plateNumber: true } },
          parkingSlot: { select: { slotNumber: true, location: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!reservations) {
        throw new BadRequestException("you don't have reservations");
      }
      return reservations;
    } catch (error: any) {
      throw new HttpException('internal server error', error);
    }
  }



  async validateReservationStatus(
    id: string,
    allowedStatuses: ReservationStatus[],
  ) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (!allowedStatuses.includes(reservation.status)) {
      throw new BadRequestException(
        `Reservation must be in status: ${allowedStatuses.join(', ')}`,
      );
    }

    return true;
  }


}
