import { Module } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehicleController } from './vehicle.controller';

@Module({
  controllers: [VehicleController],
  providers: [VehiclesService],
})
export class VehiclesModule {}
