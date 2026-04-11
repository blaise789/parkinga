import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ParkingSessionService } from './parking-session.service';
import { WalkInDto } from './dtos/walk-in.dto';
import { AuthRequest } from 'src/types';
import { AuthGuard } from 'src/guards/auth.guard'; // Using the generic guard

@ApiTags('Parking Sessions')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('sessions')
export class ParkingSessionController {
  constructor(private readonly parkingSessionService: ParkingSessionService) {}

  @Post('check-in/:reservationId')
  @ApiOperation({ summary: 'Check-in from an existing reservation' })
  @ApiParam({ name: 'reservationId' })
  @ApiResponse({ status: 201, description: 'Checked in successfully.' })
  checkInFromReservation(
    @Param('reservationId') reservationId: string,
    @Req() req: AuthRequest,
  ) {
    const clerkId = req.user?.id; 
    return this.parkingSessionService.checkInFromReservation(reservationId, clerkId);
  }

  @Post('walk-in')
  @ApiOperation({ summary: 'Create an immediate walk-in session' })
  @ApiResponse({ status: 201, description: 'Walk-in session started.' })
  walkInCheckIn(
    @Body() walkInDto: WalkInDto,
    @Req() req: AuthRequest,
  ) {
    const clerkId = req.user?.id;
    return this.parkingSessionService.walkInCheckIn(walkInDto, clerkId);
  }

  @Post(':sessionId/check-out')
  @ApiOperation({ summary: 'Check-out of a session and calculate fees' })
  @ApiParam({ name: 'sessionId' })
  @ApiResponse({ status: 200, description: 'Checked out successfully.' })
  checkOut(
    @Param('sessionId') sessionId: string,
    @Req() req: AuthRequest,
  ) {
    const clerkId = req.user?.id;
    return this.parkingSessionService.checkOut(sessionId, clerkId);
  }
}
