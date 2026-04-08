import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateVehicleDto } from './dtos/create-vehicle.dto';
import { paginator } from 'src/pagination/paginator';
import { Prisma, VehicleSize, VehicleType } from '@prisma/client';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async createVehicle(userId: string, createVehicleDto: CreateVehicleDto) {
    try {
      const vehicleExists = await this.prisma.vehicle.findUnique({
        where: {
          plateNumber: createVehicleDto.plateNumber,
        },
      });

      if (vehicleExists) {
        throw new BadRequestException('Vehicle already exists');
      }

      const vehicle = await this.prisma.vehicle.create({
        data: {
          ...createVehicleDto,
          user: {
            connect: {
              id: userId,
            },
          },
        },
      });

      return vehicle;
    } catch (error) {
      throw new HttpException('Internal server error', 500);
    }
  }

  async searchVehicle(page: number, limit: number, searchKey: string) {
    try {
      const searchUpper = searchKey?.toUpperCase();

      const whereCondition: Prisma.VehicleWhereInput | undefined = searchKey
        ? {
            OR: [
              { plateNumber: { contains: searchKey, mode: 'insensitive' } },
              ...(Object.values(VehicleType).includes(
                searchUpper as VehicleType,
              )
                ? [{ vehicleType: { equals: searchUpper as VehicleType } }]
                : []),
              ...(Object.values(VehicleSize).includes(
                searchUpper as VehicleSize,
              )
                ? [{ size: { equals: searchUpper as VehicleSize } }]
                : []),
            ],
          }
        : undefined;

      const [vehicles, total] = await this.prisma.$transaction([
        this.prisma.vehicle.findMany({
          where: whereCondition,
          take: limit,
          skip: (page - 1) * limit,
        }),
        this.prisma.vehicle.count({
          where: whereCondition,
        }),
      ]);

      return {
        vehicles,
        meta: paginator({
          page: Number(page),
          limit: Number(limit),
          total: Number(total),
        }),
      };
    } catch (error) {
      console.error('Database error:', error);
      throw new HttpException('Failed to fetch vehicles', 500);
    }
  }
}
