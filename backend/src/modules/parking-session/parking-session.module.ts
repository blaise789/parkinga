import { Module } from '@nestjs/common';
import { ParkingSessionController } from './parking-session.controller';
import { ParkingSessionService } from './parking-session.service';

@Module({
  controllers: [ParkingSessionController],
  providers: [ParkingSessionService],
})
export class ParkingSessionModule {}
