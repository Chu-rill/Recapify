import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { LoginDto, OTPDto, ResendDto, SignUpDto } from './dto/auth.dto';
import { UserRepository } from 'src/user/user.repository';
import { JwtService } from '@nestjs/jwt';
import {
  encrypt,
  comparePassword,
} from 'src/utils/helper-functions/encryption';
import { OtpService } from 'src/otp/otp.service';
import { MailService } from 'src/infra/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private userRespository: UserRepository,
    private jwt: JwtService,
    private otp: OtpService,
    private mailService: MailService,
  ) {}
  async signup(dto: SignUpDto) {
    try {
      // Check if user already exists
      let existingUser = await this.userRespository.findUserByEmail(dto.email);
      if (existingUser) {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Email already exists',
          data: null,
        };
      }

      // Create user with hashed password
      const hashedPassword = await encrypt(dto.password);
      const user = await this.userRespository.createUser(
        dto.username,
        dto.email,
        hashedPassword,
        dto.phone,
        dto.role,
      );

      // Create profile based on role
      let profile;
      if (user.role === 'STAFF') {
        // Validate hotel ID before creating staff
        if (!dto.hotelId) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Hotel ID is required for staff registration',
            data: null,
          };
        }
        profile = await this.userRespository.createStaff(user.id, dto.hotelId);
      } else if (user.role === 'CUSTOMER') {
        profile = await this.userRespository.createCustomer(user.id);
      } else if (user.role === 'ADMIN') {
        // Handle admin role if needed
        // For now, no special profile is created
      } else {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid role specified',
          data: null,
        };
      }

      // Generate and send OTP
      try {
        const otp = await this.otp.generateOTP(user.email);
        const data = {
          subject: 'InnkeeperPro validation',
          username: user.username,
          OTP: otp,
        };
        await this.mailService.sendWelcomeEmail(user.email, data);
      } catch (emailError) {
        console.log('Failed to send welcome email:', emailError);
        // Continue with signup even if email fails, but log the error
      }

      return {
        statusCode: HttpStatus.CREATED,
        message: 'User signup successful',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      };
    } catch (error) {
      console.log('Error in signup:', error);

      // Categorize errors based on type
      if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'A database conflict occurred, possibly a duplicate entry',
          data: null,
        };
      }

      // if (error.name === 'ValidationError') {
      //   return {
      //     statusCode: HttpStatus.BAD_REQUEST,
      //     message: 'Validation error: ' + error.message,
      //     data: null,
      //   };
      // }

      // Generic server error
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred during signup',
        data: null,
      };
    }
  }

  async login(dto: LoginDto) {
    try {
      const user = await this.userRespository.findUserByEmail(dto.email);
      if (!user) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'user not found',
          data: null,
        };
      }
      const isPasswordValid = await comparePassword(
        dto.password,
        user.password,
      );
      if (!isPasswordValid) {
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'invalid password',
          data: null,
        };
      }
      let { password: userPassword, ...userWithoutPassword } = user;
      const payload = {
        ...userWithoutPassword, // Spread the rest of the user properties
      };
      // const payload = {
      //   sub: user.id,
      //   username: user.firstName,
      // };
      const token = await this.jwt.signAsync(payload);
      return {
        statusCode: HttpStatus.OK,
        message: 'login successful',
        data: {
          id: user.id,
          userName: user.username,
        },
        token: token,
      };
    } catch (error) {
      console.log('Error in login:', error);
      throw new Error('Error during login');
    }
  }

  async validateOTP(dto: OTPDto) {
    const user = await this.userRespository.findUserByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate OTP
    await this.otp.verifyOTP(dto.email, dto.OTP);

    // Mark user as verified
    await this.userRespository.verifyUser(dto.email);

    // Create a token and return user data similar to login method
    let { password: userPassword, ...userWithoutPassword } = user;
    const payload = {
      ...userWithoutPassword, // Spread the rest of the user properties
    };

    const token = await this.jwt.signAsync(payload);

    return {
      statusCode: HttpStatus.OK,
      message: 'User verified successfully',
      data: {
        id: user.id,
        userName: user.username,
      },
      token: token,
    };
  }
  async resendOTP(dto: ResendDto) {
    const user = await this.userRespository.findUserByEmail(dto.email);
    if (!user) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'user not found',
        data: null,
      };
    }

    const otp = await this.otp.generateOTP(user.email);

    const data = {
      subject: 'InnkeeperPro validation',
      username: user.username,
      OTP: otp,
    };

    await this.mailService.sendWelcomeEmail(user.email, data);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'OTP Send',
    };
  }
}
