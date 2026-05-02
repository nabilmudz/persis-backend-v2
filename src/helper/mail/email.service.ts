import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.config.get('MAIL_USER'),
        pass: this.config.get('MAIL_PASS'),
      },
    });
  }

  async sendOtp(email: string, otp: string) {
    await this.transporter.sendMail({
      from: `"Persis App" <${this.config.get('MAIL_USER')}>`,
      to: email,
      subject: 'Kode OTP Aktivasi',
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:auto">
          <h2>Kode OTP Aktivasi</h2>
          <p>Gunakan kode berikut untuk aktivasi akun kamu:</p>
          <h1 style="letter-spacing:8px;font-size:40px">${otp}</h1>
          <p style="color:#888">Berlaku selama <strong>10 menit</strong>. Jangan bagikan ke siapapun.</p>
        </div>
      `,
    });
  }
}