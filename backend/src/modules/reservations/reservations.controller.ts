// src/reservations/reservations.controller.ts
import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  ParseIntPipe,
  Req,
  UseGuards,
  Get,
  Query,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dtos/reservation.dto';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthRequest } from 'src/types';
import { DriverGuard } from 'src/guards/driver.guard';
import { VehicleSize, VehicleType } from '@prisma/client';
import { AdminGuard } from 'src/guards/admin.guard';

@ApiTags('Reservations')
@ApiBearerAuth()
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiResponse({
    status: 201,
    description: 'Reservation created successfully',
  })
  @ApiBody({ type: CreateReservationDto })
  // @UseGuards(DriverGuard)
  @UseGuards(AdminGuard)
  create(
    @Req() req: AuthRequest,
    @Body() createReservationDto: CreateReservationDto,
  ) {
    console.log(req.user.id);
    return this.reservationsService.create(req.user.id, createReservationDto);
  }

  @Get('available-slots')
  @ApiOperation({
    summary: 'Find available parking slots',
    description:
      'Returns available parking slots matching vehicle requirements',
  })
  @ApiQuery({
    name: 'vehicleType',
    enum: VehicleType,
    description: 'Type of vehicle (CAR, MOTORCYCLE, etc)',
  })
  @ApiQuery({
    name: 'size',
    enum: VehicleSize,
    description: 'Size of vehicle (SMALL, MEDIUM, LARGE)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available parking slots',
    // type: [ReservationResponseDto],
  })
  async findAvailableSlots(
    @Query('vehicleType') vehicleType: VehicleType,
    @Query('size') size: VehicleSize,
  ) {
    return this.reservationsService.findAvailableSlots(vehicleType, size);
  }

  @Post(':id/approve')
  @ApiOperation({
    summary: 'Approve a reservation',
    description: 'Approves a pending reservation and assigns a parking slot',
  })
  @ApiParam({
    name: 'id',
    description: 'Reservation ID to approve',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Reservation approved',
    // type: ReservationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid reservation status' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  async approveReservation(@Param('id') id: string) {
    return this.reservationsService.approveReservation(id);
  }

  @Post(':id/reject')
  @ApiOperation({
    summary: 'Reject a reservation',
    description: 'Rejects a pending reservation with optional reason',
  })
  @ApiParam({
    name: 'id',
    description: 'Reservation ID to reject',
    type: String,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Optional reason for rejection',
          example: 'No available slots',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Reservation rejected',
    // type: ReservationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid reservation status' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  async rejectReservation(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.reservationsService.rejectReservation(id, reason);
  }



  @Get('user/me')
  @ApiOperation({
    summary: "Get current user's reservations",
    description: 'Returns all reservations for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: "User's reservations",
  })
  @UseGuards(AdminGuard)
  async findUserReservations(@Req() req: AuthRequest) {
    try {
      console.log(req.user.id);
      return this.reservationsService.findReservations(req.user.id);
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }
}
