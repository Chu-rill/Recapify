import { Injectable } from "@nestjs/common";
import { Resend } from "resend";
import * as fs from "fs/promises";
import * as handlebars from "handlebars";
import * as path from "path";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MailService {
  private resend: Resend;
  private welcomeTemplatePath: string;
  private welcomeOauthTemplatePath: string;
  private fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const resendApiKey = configService.get<string>("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    this.resend = new Resend(resendApiKey);
    this.fromEmail = configService.get<string>("FROM_EMAIL") || "onboarding@resend.dev";

    this.welcomeTemplatePath = path.join(
      process.cwd(),
      "src/views/welcome.hbs"
    );
    this.welcomeOauthTemplatePath = path.join(
      process.cwd(),
      "src/views/welcome-oauth.hbs"
    );
  }

  // Method to read the email template file based on a path
  private async readTemplateFile(templatePath: string): Promise<string> {
    try {
      return await fs.readFile(templatePath, "utf-8");
    } catch (error) {
      throw new Error(`Error reading email template file: ${error}`);
    }
  }

  // Send an email without a template
  async sendEmail(
    email: string,
    subject: string,
    text?: string
  ): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject,
        text: text || "",
      });

      if (error) {
        throw new Error(`Failed to send email: ${error.message}`);
      }

      console.log(`Message sent successfully. ID: ${data?.id}`);
    } catch (error) {
      console.error(
        `Error sending email: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      throw error;
    }
  }

  // Send an email with a template
  async sendWelcomeEmail(
    email: string,
    data: { subject: string; username: string; OTP: string }
  ): Promise<void> {
    try {
      const templateSource = await this.readTemplateFile(
        this.welcomeTemplatePath
      );
      const emailTemplate = handlebars.compile(templateSource);

      const htmlContent = emailTemplate({
        PlatformName: "Recapify",
        Username: data.username,
        title: "Welcome to Recapify",
        OTP: data.OTP,
      });

      const { data: result, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: data.subject,
        html: htmlContent,
      });

      if (error) {
        throw new Error(`Failed to send welcome email: ${error.message}`);
      }

      console.log(`Welcome email sent successfully. ID: ${result?.id}`);
    } catch (error) {
      console.error(
        `Error sending welcome email: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      throw error;
    }
  }

  //send an email with a template for OAuth
  async sendOauthEmail(
    email: string,
    data: { subject: string; username: string }
  ): Promise<void> {
    try {
      const templateSource = await this.readTemplateFile(
        this.welcomeOauthTemplatePath
      );
      const emailTemplate = handlebars.compile(templateSource);

      const htmlContent = emailTemplate({
        PlatformName: "Recapify",
        Username: data.username,
        title: "Welcome to Recapify",
      });

      const { data: result, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: data.subject,
        html: htmlContent,
      });

      if (error) {
        throw new Error(`Failed to send OAuth welcome email: ${error.message}`);
      }

      console.log(`OAuth welcome email sent successfully. ID: ${result?.id}`);
    } catch (error) {
      console.error(
        `Error sending OAuth welcome email: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      throw error;
    }
  }
}
