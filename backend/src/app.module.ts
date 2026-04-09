import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { FileModule } from './modules/file/file.module';
import { AdminModule } from './modules/admin/admin.module';
import { UserModule } from './modules/user/user.module';

import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from './mail/mail.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import appConfig from './config/app.config';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { ParkingSlotsModule } from './modules/parking-slots/parking-slots.module';
import { ParkingSessionModule } from './modules/parking-session/parking-session.module';
import { ParkingSessionController } from './modules/parking-session/parking-session.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.register({
      global: true,
      secret: appConfig().jwt.secret,
      signOptions: { expiresIn: appConfig().jwt.expiresIn as any },
    }),

    AuthModule,
    FileModule,
    AdminModule,
    UserModule,
    MailModule,
    PrismaModule,
    ParkingSlotsModule,
    ReservationsModule,
    VehiclesModule,
    ParkingSessionModule,
  ],

  controllers: [ParkingSessionController],
  providers: [],
})
export class AppModule {}
