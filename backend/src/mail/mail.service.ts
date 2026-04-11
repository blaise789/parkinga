import { HttpException, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { welcome } from './templates/welcome';
import { initiateEmailVerification } from './templates/initiate-email-verification';
import { initiatePasswordReset } from './templates/initiate-password-reset';
import { passwordResetSuccessful } from './templates/password-reset-successful';
import { emailVerified } from './templates/email-verified';
import { ConfigService } from '@nestjs/config';
import { $Enums, Prisma } from '@prisma/client';
import { reservationApprovalTemplate } from './templates/reservation-approval.template';
import { reservationRejectionTemplate } from './templates/reservation-rejected.email';

@Injectable()
export class MailService {
  async sendReservationApproval(
    email: string,
    slotNumber: string,
    vehicle: {
      plateNumber: string;
      vehicleType: $Enums.VehicleType;
      size: $Enums.VehicleSize;
    },
    slotLocation: string,
    expirationDate?: Date,
  ) {
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        to: email,
        subject: 'Parking Reservation Approved',
        html: reservationApprovalTemplate({
          slotNumber,
          plateNumber: vehicle.plateNumber,
          vehicleType: vehicle.vehicleType,
          vehicleSize: vehicle.size,
          location: slotLocation,
          expirationDate: expirationDate || null,
        }),
      };

      console.log(`[MAIL SERVICE]: Sending reservation approval to ${email}`);
      await this.transporter.sendMail(mailOptions);
      console.log(`[MAIL SERVICE]: Reservation approval sent to ${email}`);
    } catch (error) {
      console.error('[MAIL SERVICE ERROR]:', error);
      throw new HttpException('Failed to send reservation approval email', 500);
    }
  }
  private transporter: nodemailer.Transporter;
  constructor(private configService: ConfigService) {

    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: this.configService.get('MAIL_PORT'),

      secure: false,
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASSWORD'),
      },
    });
  }

  async sendWelcomeEmail({ names, email }: { email: string; names: string }) {
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        to: email,
        subject: 'Welcome to NestJS',
        html: welcome({ names }),
      };
      console.log('[APPLICATION LOG]: Sending welcome email to ' + email);
      await this.transporter.sendMail(mailOptions);
      console.log('[APPLICATION LOG]: Mail to ' + email + ' sent');
    } catch (error: any) {
      console.log(error);
      throw new HttpException(error.message, 500);
    }
  }

  async sendInitiateEmailVerificationEmail({
    email,
    verificationCode,
    names,
  }: {
    email: string;
    verificationCode: string;
    names: string;
  }) {
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        to: email,
        subject: 'Verify your email address',
        html: initiateEmailVerification({ names, verificationCode }),
      };
      console.log('[APPLICATION LOG]: Sending email verification to ' + email);
      await this.transporter.sendMail(mailOptions);
      console.log('[APPLICATION LOG]: Mail sent to ' + email + ' successfully');
    } catch (error: any) {
      console.log(error);
      throw new HttpException(error.message, 500);
    }
  }

  async sendInitiatePasswordResetEmail({
    email,
    token,
    names,
  }: {
    email: string;
    token: string;
    names: string;
  }) {
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        to: email,
        subject: 'Reset your password',
        html: initiatePasswordReset({ token, names }),
      };
      console.log(
        '[APPLICATION LOG]: Sending password reset initialization to ' + email,
      );
      await this.transporter.sendMail(mailOptions);
      console.log('[APPLICATION LOG]: Mail sent to ' + email + ' successfully');
    } catch (error: any) {
      console.log(error);
      throw new HttpException(error.message, 500);
    }
  }

  async sendPasswordResetSuccessfulEmail({
    email,
    names,
  }: {
    email: string;
    names: string;
  }) {
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        to: email,
        subject: 'Password reset successful',
        html: passwordResetSuccessful({ names }),
      };
      console.log('[APPLICATION LOG]: Sending password successful to ' + email);
      await this.transporter.sendMail(mailOptions);
      console.log('[APPLICATION LOG]: Mail sent to ' + email + ' successfully');
    } catch (error: any) {
      console.log(error);
      throw new HttpException(error.message, 500);
    }
  }

  async sendEmailVerificationSuccessfulEmail({
    email,
    names,
  }: {
    email: string;
    names: string;
  }) {
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        to: email,
        subject: 'Email Verification successful',
        html: emailVerified({ names }),
      };
      console.log(
        '[APPLICATION LOG]: Sending email verification successful to ' + email,
      );
      await this.transporter.sendMail(mailOptions);
      console.log('[APPLICATION LOG]: Mail sent to ' + email + ' successfully');
    } catch (error: any) {
      console.log(error);
      throw new HttpException(error.message, 500);
    }
  }
  async sendReservationRejection(
    email: string,
    vehicle: {
      plateNumber: string;
      vehicleType: $Enums.VehicleType;
      size: $Enums.VehicleSize;
    },
    reason: string,
    slotLocation?: string,
  ) {
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        to: email,
        subject: 'Parking Reservation Rejected',
        html: reservationRejectionTemplate({
          plateNumber: vehicle.plateNumber,
          vehicleType: vehicle.vehicleType,
          vehicleSize: vehicle.size,
          location: slotLocation,
          reason,
        }),
      };

      console.log(`[MAIL SERVICE]: Sending reservation rejection to ${email}`);
      await this.transporter.sendMail(mailOptions);
      console.log(`[MAIL SERVICE]: Reservation rejection sent to ${email}`);
    } catch (error) {
      console.error('[MAIL SERVICE ERROR]:', error);
      throw new HttpException(
        'Failed to send reservation rejection email',
        500,
      );
    }
  }
}
