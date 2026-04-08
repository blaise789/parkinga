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

  private async checkExistingReservation(vehicleId: number) {
    const existing = await this.prisma.reservation.findFirst({
      where: {
        vehicleId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });
    if (existing)
      throw new ConflictException(
        `Active reservation exists (status: ${existing.status})`,
      );
  }

  async create(userId: string, { vehicleId }: CreateReservationDto) {
    await this.validateVehicleOwnership(userId, vehicleId);
    await this.checkExistingReservation(vehicleId);

    return this.prisma.reservation.create({
      data: { status: 'PENDING', vehicleId, userId },
      include: { vehicle: true, user: true },
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
      include: { vehicle: true, user: true },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.status !== 'PENDING') {
      throw new BadRequestException(
        'Only pending reservations can be approved',
      );
    }

    const assignedSlot = await this.assignSlotAutomatically(
      reservation.vehicle.vehicleType,
      reservation.vehicle.size,
    );

    if (!assignedSlot) {
      throw new BadRequestException(
        'No available slot matches vehicle requirements',
      );
    }

    // Send approval email
    await this.mailService.sendReservationApproval(
      reservation.user.email,
      assignedSlot.slotNumber,
      reservation.vehicle,
      assignedSlot.location,
    );

    return this.prisma.reservation.update({
      where: { id },
      data: {
        slotId: assignedSlot.id,
        status: 'APPROVED',
        expiration: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      },
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

  private async assignSlotAutomatically(
    vehicleType: VehicleType,
    size: VehicleSize,
  ) {
    const slot = await this.prisma.parkingSlot.findFirst({
      where: {
        status: 'AVAILABLE',
        vehicleType,
        size,
      },
    });

    if (!slot) return null;

    await this.prisma.parkingSlot.update({
      where: { id: slot.id },
      data: { status: 'UNAVAILABLE' },
    });

    return slot;
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

  async assignSlot(reservationId: string, slotId: string) {
    await this.validateReservationStatus(reservationId, ['PENDING']);

    const slot = await this.prisma.parkingSlot.findUnique({
      where: { id: slotId },
      select: { status: true, vehicleType: true, size: true },
    });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    if (slot.status !== 'AVAILABLE') {
      throw new BadRequestException('Slot is not available');
    }

    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { vehicle: true },
    });

    if (
      !reservation ||
      slot.vehicleType !== reservation.vehicle.vehicleType ||
      slot.size !== reservation.vehicle.size
    ) {
      throw new BadRequestException('Slot does not match vehicle requirements');
    }

    // Update both records in a transaction
    return this.prisma.$transaction([
      this.prisma.parkingSlot.update({
        where: { id: slotId },
        data: { status: 'UNAVAILABLE' },
      }),
      this.prisma.reservation.update({
        where: { id: reservationId },
        data: {
          slotId,
          status: 'APPROVED',
          expiration: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      }),
    ]);
  }
}
