import { Module } from '@nestjs/common';
import { ParkingSlotsService } from './parking-slots.service';
import { ParkingSlotsController } from './parking-slots.controller';

@Module({
  providers: [ParkingSlotsService],
  controllers: [ParkingSlotsController],
})
export class ParkingSlotsModule {}
