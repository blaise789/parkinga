import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDTO } from '../user/dto/create-user.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const users = await this.prisma.user.count();
    const vehicles = await this.prisma.vehicle.count();
    const reservations = await this.prisma.reservation.count();
    const parkingSlots = await this.prisma.parkingSlot.count();
    // const files = await this.prisma.file.count();
    // const orders=await this.prisma.order.count()
    return { users, parkingSlots, reservations, vehicles };
  }

  async createAdmin(dto: CreateUserDTO) {
    const admin = await this.prisma.user.create({
      data: {
        ...dto,
        role: 'ADMIN',
      },
    });
    return admin;
  }
}
