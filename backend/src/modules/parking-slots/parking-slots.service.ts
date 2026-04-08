import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateParkingSlotDto } from './dtos/create-parking-slot.dto';
import {
  ParkingLocation,
  ParkingSlot,
  Prisma,
  SlotStatus,
  VehicleSize,
  VehicleType,
} from '@prisma/client';
import { paginator } from 'src/pagination/paginator';
import { UpdateParkingSlotDto } from './dtos/update-parking-lot.dto';
import { BulkCreateParkingSlotDto } from './dtos/builk-create-slots.dto';

@Injectable()
export class ParkingSlotsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number, limit: number, searchKey?: string) {
    // Convert searchKey to uppercase for enum comparison
    const searchUpper = searchKey?.toUpperCase();

    const whereCondition = searchKey
      ? ({
          OR: [
            // String field search (case insensitive)
            { slotNumber: { contains: searchKey, mode: 'insensitive' } },

            // Enum field searches (exact match only)
            ...(Object.values(VehicleType).includes(searchUpper as VehicleType)
              ? [{ vehicleType: { equals: searchUpper as VehicleType } }]
              : []),
            ...(Object.values(VehicleSize).includes(searchUpper as VehicleSize)
              ? [{ size: { equals: searchUpper as VehicleSize } }]
              : []),
            ...(Object.values(ParkingLocation).includes(
              searchUpper as ParkingLocation,
            )
              ? [{ location: { equals: searchUpper as ParkingLocation } }]
              : []),
          ],
        } as Prisma.ParkingSlotWhereInput)
      : undefined;

    try {
      const [parkingSlots, total] = await this.prisma.$transaction([
        this.prisma.parkingSlot.findMany({
          where: whereCondition, // Apply the same condition here
          take: Number(limit),
          skip: (page - 1) * limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.parkingSlot.count({
          where: whereCondition,
        }),
      ]);

      return {
        parkingSlots,
        meta: paginator({
          page: Number(page),
          limit: Number(limit),
          total: Number(total),
        }),
      };
    } catch (error) {
      console.error('Database error:', error);
      throw new HttpException('Failed to fetch parking slots', 500);
    }
  }

  // parking-lots/parking-slots.service.ts
  async bulkCreateSlots(
    bulkDto: BulkCreateParkingSlotDto,
  ): Promise<ParkingSlot[]> {
    const { count, vehicleType, size, location, status } = bulkDto;
    const generatedSlots: CreateParkingSlotDto[] = [];

    // Generate sequential slot numbers
    const existingSlots = await this.prisma.parkingSlot.findMany({
      select: { slotNumber: true },
      orderBy: { slotNumber: 'desc' },
      take: 1,
    });

    const lastNumber = existingSlots[0]?.slotNumber
      ? parseInt(existingSlots[0].slotNumber.replace('S', ''))
      : 0;

    for (let i = 1; i <= count; i++) {
      const slotNumber = `S${(lastNumber + i).toString().padStart(3, '0')}`;
      generatedSlots.push({
        slotNumber,
        vehicleType,
        size,
        location,
        status: status ?? SlotStatus.AVAILABLE,
      });
    }

    try {
      await this.prisma.parkingSlot.createMany({
        data: generatedSlots,
        skipDuplicates: true,
      });

      return this.prisma.parkingSlot.findMany({
        where: {
          slotNumber: {
            in: generatedSlots.map((slot) => slot.slotNumber),
          },
        },
      });
    } catch (error: any) {
      throw new HttpException(
        `Failed to bulk create slots: ${error.message}`,
        500,
      );
    }
  }
  // generating random slots
  private getRandomEnumValue<T extends Record<string, any>>(
    enumObj: T,
  ): T[keyof T] {
    const enumValues = Object.values(enumObj);
    const randomIndex = Math.floor(Math.random() * enumValues.length);
    return enumValues[randomIndex] as T[keyof T];
  }
  // updating slots
  async updateSlot(id: string, updateDto: UpdateParkingSlotDto) {
    try {
      const existingSlot = await this.prisma.parkingSlot.findUnique({
        where: { id },
      });

      if (!existingSlot) {
        throw new HttpException('Parking slot not found', 404);
      }

      const updatedSlot = await this.prisma.parkingSlot.update({
        where: { id },
        data: updateDto,
      });

      return updatedSlot;
    } catch (error: any) {
      console.error('Update error:', error);
      throw new HttpException(
        `Failed to update parking slot: ${error.message}`,
        500,
      );
    }
  }

  // Implemented deleteSlot method
  async deleteSlot(id: string) {
    try {
      const existingSlot = await this.prisma.parkingSlot.findUnique({
        where: { id },
      });

      if (!existingSlot) {
        throw new HttpException('Parking slot not found', 404);
      }

      const deletedSlot = await this.prisma.parkingSlot.delete({
        where: { id },
      });

      return deletedSlot;
    } catch (error: any) {
      console.error('Delete error:', error);
      throw new HttpException(
        `Failed to delete parking slot: ${error.message}`,
        500,
      );
    }
  }

  // Implemented createParkingSlot method
  async createParkingSlot(dto: CreateParkingSlotDto) {
    console.log(dto);
    // Check if slot number already exists
    const existingSlot = await this.prisma.parkingSlot.findFirst({
      where: { slotNumber: dto.slotNumber },
    });

    if (existingSlot) {
      throw new HttpException('Slot number already exists', 400);
    }

    const createdSlot = await this.prisma.parkingSlot.create({
      data: dto,
    });

    return createdSlot;
  }

  // Implemented findById method
  async findById(id: string) {
    try {
      const slot = await this.prisma.parkingSlot.findUnique({
        where: { id },
      });

      if (!slot) {
        throw new HttpException('Parking slot not found', 404);
      }

      return slot;
    } catch (error: any) {
      console.error('Find by ID error:', error);
      throw new HttpException(
        `Failed to find parking slot: ${error.message}`,
        500,
      );
    }
  }
}
