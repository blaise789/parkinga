import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { WalkInDto } from './dtos/walk-in.dto';

@Injectable()
export class ParkingSessionService {
  constructor(private prisma: PrismaService) {}

  // Generates a human readable S-YYYYMMDD-001 ticket
  private async generateSessionNumber(): Promise<string> {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = Math.floor(100 + Math.random() * 900); 
    return `S-${date}-${suffix}`;
  }

  async checkInFromReservation(reservationId: string, checkedInBy?: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { parkingSlot: true }
    });

    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.status !== 'APPROVED') {
      throw new BadRequestException(`Cannot check in. Reservation status is ${reservation.status}`);
    }

    if (reservation.expiration && new Date() > reservation.expiration) {
      // Mark as expired
      await this.prisma.reservation.update({
        where: { id: reservationId },
        data: { status: 'EXPIRED' }
      });
      // Free slot
      await this.prisma.parkingSlot.update({
        where: { id: reservation.slotId },
        data: { status: 'AVAILABLE' }
      });
      throw new BadRequestException('Reservation has expired');
    }

    const sessionNumber = await this.generateSessionNumber();

    return this.prisma.$transaction(async (prisma) => {
      // Update Reservation
      await prisma.reservation.update({
        where: { id: reservationId },
        data: { status: 'COMPLETED' }
      });

      // Update Slot
      await prisma.parkingSlot.update({
        where: { id: reservation.slotId },
        data: { status: 'UNAVAILABLE' }
      });

      // Create Session
      return prisma.parkingSession.create({
        data: {
          sessionNumber,
          userId: reservation.userId,
          vehicleId: reservation.vehicleId,
          slotId: reservation.slotId,
          reservationId: reservation.id,
          status: 'ACTIVE',
          entryTime: new Date(),
          checkedInBy
        }
      });
    });
  }

  async walkInCheckIn(dto: WalkInDto, checkedInBy?: string) {
    const { userId, vehicleId, slotId, notes, prepaidHours } = dto;

    const slot = await this.prisma.parkingSlot.findUnique({ where: { id: slotId } });
    if (!slot) throw new NotFoundException('Slot not found');
    if (slot.status !== 'AVAILABLE') throw new BadRequestException('Slot is not available');

    const sessionNumber = await this.generateSessionNumber();

    return this.prisma.$transaction(async (prisma) => {
      await prisma.parkingSlot.update({
        where: { id: slotId },
        data: { status: 'UNAVAILABLE' }
      });

      return prisma.parkingSession.create({
        data: {
          sessionNumber,
          userId,
          vehicleId,
          slotId,
          status: 'ACTIVE',
          entryTime: new Date(),
          checkedInBy,
          notes,
          prepaidHours
        }
      });
    });
  }

  async checkOut(sessionId: string, checkedOutBy?: string) {
    const session = await this.prisma.parkingSession.findUnique({
      where: { id: sessionId },
      include: { parkingSlot: true }
    });

    if (!session) throw new NotFoundException('Parking session not found');
    if (session.status !== 'ACTIVE') throw new BadRequestException(`Session is not active (current: ${session.status})`);

    const exitTime = new Date();
    const entryTime = session.entryTime;
    const durationHours = Math.ceil((exitTime.getTime() - entryTime.getTime()) / (1000 * 60 * 60)); // Round up to next hour

    // Baseline fallback from Slot
    let hourlyRate = session.parkingSlot.hourlyRate || 2.50;
    
    // Dynamic Rate Override check
    const rateConfig = await this.prisma.rateConfig.findFirst({
      where: {
        location: session.parkingSlot.location,
        isActive: true,
        effectiveFrom: { lte: exitTime },
      },
      orderBy: { effectiveFrom: 'desc' }
    });
    if (rateConfig) {
      hourlyRate = rateConfig.hourlyRate;
    }

    // Minimum 1 hour charge
    const chargeableHours = durationHours > 0 ? durationHours : 1;
    const totalFee = chargeableHours * hourlyRate;

    return this.prisma.$transaction(async (prisma) => {
      // Free slot
      await prisma.parkingSlot.update({
        where: { id: session.slotId },
        data: { status: 'AVAILABLE' }
      });

      // Complete session
      return prisma.parkingSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          exitTime,
          totalFee,
          checkedOutBy,
          paymentStatus: 'PENDING'
        }
      });
    });
  }
}
