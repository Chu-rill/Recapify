import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs/promises';
import * as handlebars from 'handlebars';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { last } from 'rxjs';
import { BookingStatus, RoomType } from '@prisma/client';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private welcomeTemplatePath: string;
  private bookingTemplatePath: string;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: configService.get<string>('EMAIL_PROVIDER'),
      port: Number(configService.get<string>('SERVICE_PORT')),
      secure: false,
      service: 'gmail',
      auth: {
        user: configService.get<string>('EMAIL_USER'),
        pass: configService.get<string>('EMAIL_PASS'),
      },
    });

    this.welcomeTemplatePath = path.join(__dirname, '../../views/welcome.hbs');
    this.bookingTemplatePath = path.join(__dirname, '../../views/booking.hbs');
  }

  // Method to read the email template file based on a path
  private async readTemplateFile(templatePath: string): Promise<string> {
    try {
      return await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      throw new Error(`Error reading email template file: ${error}`);
    }
  }

  // Send an email without a template
  async sendEmail(
    email: string,
    subject: string,
    text?: string,
  ): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_USER'),
        to: email,
        subject,
        text: text || '',
      });

      console.log(`Message sent: ${info.response}`);
    } catch (error) {
      console.error(
        `Error sending email: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Send an email with a template
  async sendWelcomeEmail(
    email: string,
    data: { subject: string; username: string; OTP: string },
  ): Promise<void> {
    try {
      const templateSource = await this.readTemplateFile(
        this.welcomeTemplatePath,
      );
      const emailTemplate = handlebars.compile(templateSource);

      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_USER'),
        to: email,
        subject: data.subject,
        html: emailTemplate({
          PlatformName: 'InnkeeperPro',
          Username: data.username,
          title: 'Welcome Email',
          OTP: data.OTP,
        }),
      });

      console.log(`Message sent: ${info.response}`);
    } catch (error) {
      console.error(
        `Error sending email with template: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Send an email when a booking is made
  async sendBookingEmail(
    email: string,
    data: {
      subject: string;
      username: string;
      bookingId: string;
      hotelName: string;
      checkIn: Date;
      checkOut: Date;
      roomType: RoomType;
      roomNumber: number;
      status: BookingStatus;
    },
  ): Promise<void> {
    try {
      const templateSource = await this.readTemplateFile(
        this.bookingTemplatePath,
      );
      const emailTemplate = handlebars.compile(templateSource);

      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_USER'),
        to: email,
        subject: data.subject,
        html: emailTemplate({
          userName: data.username,
          bookingId: data.bookingId,
          hotelName: data.hotelName,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          roomType: data.roomType,
          roomNumber: data.roomNumber,
          status: data.status,
        }),
      });

      console.log(`Message sent: ${info.response}`);
    } catch (error) {
      console.error(
        `Error sending email with template: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
