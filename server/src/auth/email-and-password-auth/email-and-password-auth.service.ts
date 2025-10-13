import { HttpStatus, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { UserRepository } from "src/user/user.repository";
import { JwtService } from "@nestjs/jwt";
import {
  encrypt,
  comparePassword,
} from "src/utils/helper-functions/encryption";
import { OtpService } from "src/otp/otp.service";
import { MailService } from "src/infra/mail/mail.service";
import {
  CreateLoginDto,
  CreateOTPDto,
  CreateSignupDto,
  ResendOTPDto,
} from "./validation";
import { PrismaService } from "src/infra/db/prisma.service";
import * as crypto from "crypto";

@Injectable()
export class AuthService {
  constructor(
    private userRespository: UserRepository,
    private jwt: JwtService,
    private otp: OtpService,
    private mailService: MailService,
    private prisma: PrismaService
  ) {}

  // Helper method to generate refresh token
  private async generateRefreshToken(userId: string): Promise<string> {
    const refreshToken = crypto.randomBytes(64).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return refreshToken;
  }

  // Helper method to clean up old refresh tokens for a user
  private async cleanupOldRefreshTokens(userId: string): Promise<void> {
    // Remove expired tokens
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // Keep only the 5 most recent tokens per user
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: 5,
    });

    if (tokens.length > 0) {
      await this.prisma.refreshToken.deleteMany({
        where: {
          id: {
            in: tokens.map((t) => t.id),
          },
        },
      });
    }
  }
  async signup(dto: CreateSignupDto) {
    try {
      // Check if user already exists
      let existingUser = await this.userRespository.findUserByEmail(dto.email);
      if (existingUser) {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: "Email already exists",
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
        dto.role || "USER" // Provide default role if undefined
      );

      // Generate and send OTP
      try {
        const otp = await this.otp.generateOTP(user.email);
        const data = {
          subject: "Recapify Validation",
          username: user.username,
          OTP: otp,
        };
        await this.mailService.sendWelcomeEmail(user.email, data);
      } catch (emailError) {
        console.log("Failed to send welcome email:", emailError);
        // Continue with signup even if email fails, but log the error
      }

      return {
        statusCode: HttpStatus.CREATED,
        message: "User signup successful",
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      };
    } catch (error) {
      console.log("Error in signup:", error);

      // Categorize errors based on type
      if (error.code === "23505" || error.code === "ER_DUP_ENTRY") {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: "A database conflict occurred, possibly a duplicate entry",
          data: null,
        };
      }

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "An error occurred during signup",
        data: null,
      };
    }
  }

  async login(dto: CreateLoginDto) {
    try {
      const user = await this.userRespository.findUserByEmail(dto.email);
      if (!user || !user.password) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: "user not found",
          data: null,
        };
      }
      const isPasswordValid = await comparePassword(
        dto.password,
        user.password
      );
      if (!isPasswordValid) {
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: "invalid password",
          data: null,
        };
      }

      // Check if user is verified
      if (!user.isVerified) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message:
            "Please verify your email before logging in. Check your inbox for the OTP.",
          data: null,
        };
      }

      // Create JWT payload with only necessary fields (match OAuth format)
      const payload = {
        id: user.id,
        username: user.username,
        role: user.role,
      };

      const token = await this.jwt.signAsync(payload);

      // Generate refresh token
      await this.cleanupOldRefreshTokens(user.id);
      const refreshToken = await this.generateRefreshToken(user.id);

      return {
        statusCode: HttpStatus.OK,
        message: "login successful",
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
        },
        token: token,
        refreshToken: refreshToken,
      };
    } catch (error) {
      console.log("Error in login:", error);
      throw new Error("Error during login");
    }
  }

  async validateOTP(dto: CreateOTPDto) {
    const user = await this.userRespository.findUserByEmail(dto.email);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Validate OTP
    await this.otp.verifyOTP(dto.email, dto.OTP);

    // Mark user as verified
    await this.userRespository.verifyUser(dto.email);

    // Create JWT payload with only necessary fields (match OAuth and login format)
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    const token = await this.jwt.signAsync(payload);

    // Generate refresh token
    await this.cleanupOldRefreshTokens(user.id);
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      statusCode: HttpStatus.OK,
      message: "User verified successfully",
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: true,
      },
      token: token,
      refreshToken: refreshToken,
    };
  }
  async resendOTP(dto: ResendOTPDto) {
    const user = await this.userRespository.findUserByEmail(dto.email);
    if (!user) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: "user not found",
        data: null,
      };
    }

    const otp = await this.otp.generateOTP(user.email);

    const data = {
      subject: "InnkeeperPro validation",
      username: user.username,
      OTP: otp,
    };

    await this.mailService.sendWelcomeEmail(user.email, data);

    return {
      statusCode: HttpStatus.CREATED,
      message: "OTP Send",
    };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      // Find the refresh token in database
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Check if token is expired
      if (tokenRecord.expiresAt < new Date()) {
        // Delete expired token
        await this.prisma.refreshToken.delete({
          where: { id: tokenRecord.id },
        });
        throw new UnauthorizedException("Refresh token expired");
      }

      // Check if token is revoked
      if (tokenRecord.revoked) {
        throw new UnauthorizedException("Refresh token has been revoked");
      }

      // Generate new access token
      const payload = {
        id: tokenRecord.user.id,
        username: tokenRecord.user.username,
        role: tokenRecord.user.role,
      };

      const newAccessToken = await this.jwt.signAsync(payload);

      // Optionally rotate refresh token for enhanced security
      // Delete old refresh token and create new one
      await this.prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      });

      const newRefreshToken = await this.generateRefreshToken(
        tokenRecord.user.id
      );

      return {
        statusCode: HttpStatus.OK,
        message: "Token refreshed successfully",
        token: newAccessToken,
        refreshToken: newRefreshToken,
        data: {
          id: tokenRecord.user.id,
          username: tokenRecord.user.username,
          email: tokenRecord.user.email,
          role: tokenRecord.user.role,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.log("Error refreshing token:", error);
      throw new UnauthorizedException("Failed to refresh token");
    }
  }

  async revokeRefreshToken(refreshToken: string) {
    try {
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!tokenRecord) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: "Refresh token not found",
        };
      }

      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revoked: true },
      });

      return {
        statusCode: HttpStatus.OK,
        message: "Refresh token revoked successfully",
      };
    } catch (error) {
      console.log("Error revoking token:", error);
      throw new Error("Failed to revoke refresh token");
    }
  }
}
