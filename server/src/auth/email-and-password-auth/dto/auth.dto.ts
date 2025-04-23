import { Role } from '@prisma/client';
export class CreateAuthDto {}

export type SignUpDto = {
  username: string;
  email: string;
  password: string;
  phone?: string;
  role?: Role;
  hotelId?: string;
};

export type LoginDto = {
  email: string;
  password: string;
};

export type OTPDto = {
  email: string;
  OTP: string;
};
export type ResendDto = {
  email: string;
};
