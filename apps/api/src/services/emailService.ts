// Email service for sending password reset emails
// Configure with environment variables for different providers

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private provider: string;

  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || 'console'; // 'console', 'sendgrid', 'ses', 'smtp'
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/provider/reset-password?token=${resetToken}`;

    const subject = 'Password Reset - HelpingHandVI';
    const html = this.getPasswordResetHtml(resetLink);
    const text = this.getPasswordResetText(resetLink);

    await this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }

  private getPasswordResetHtml(resetLink: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #4F46E5; margin: 0; text-align: center;">HelpingHandVI</h1>
        </div>

        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>

          <p style="color: #6b7280; line-height: 1.6;">
            You requested a password reset for your HelpingHandVI account. Click the button below to reset your password.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}"
               style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            <strong>This link will expire in 1 hour.</strong>
          </p>

          <p style="color: #6b7280; font-size: 14px;">
            If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            HelpingHandVI - Connecting customers with trusted service providers in the Virgin Islands
          </p>
        </div>
      </div>
    `;
  }

  private getPasswordResetText(resetLink: string): string {
    return `
HelpingHandVI - Password Reset

You requested a password reset for your HelpingHandVI account.

Click this link to reset your password:
${resetLink}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

---
HelpingHandVI - Connecting customers with trusted service providers in the Virgin Islands
    `.trim();
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    switch (this.provider) {
      case 'sendgrid':
        await this.sendWithSendGrid(options);
        break;
      case 'ses':
        await this.sendWithSES(options);
        break;
      case 'smtp':
        await this.sendWithSMTP(options);
        break;
      default:
        await this.sendToConsole(options);
    }
  }

  private async sendWithSendGrid(options: EmailOptions): Promise<void> {
    // Dynamic import to avoid requiring SendGrid if not used
    // In test environment, use static import for mocking
    let sgMail: any;
    if (process.env.NODE_ENV === 'test') {
      const sgMailModule = require('@sendgrid/mail');
      sgMail = sgMailModule.default || sgMailModule;
    } else {
      const sgMailModule = await import('@sendgrid/mail');
      sgMail = sgMailModule.default;
    }

    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY environment variable is required for SendGrid provider');
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await sgMail.send({
      to: options.to,
      from: process.env.FROM_EMAIL || 'noreply@helpinghandvi.com',
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`✅ Password reset email sent to ${options.to} via SendGrid`);
  }

  private async sendWithSES(options: EmailOptions): Promise<void> {
    // TODO: Install @aws-sdk/client-ses and implement
    throw new Error('AWS SES not implemented yet. Use console provider for development.');
  }

  private async sendWithSMTP(options: EmailOptions): Promise<void> {
    // TODO: Install nodemailer and implement
    throw new Error('SMTP not implemented yet. Use console provider for development.');
  }

  private async sendToConsole(options: EmailOptions): Promise<void> {
    console.log('='.repeat(80));
    console.log('📧 EMAIL WOULD BE SENT (using console provider)');
    console.log('='.repeat(80));
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`HTML Length: ${options.html.length} characters`);
    console.log(`Text Length: ${options.text.length} characters`);
    console.log('');
    console.log('TEXT VERSION:');
    console.log('-'.repeat(40));
    console.log(options.text);
    console.log('='.repeat(80));
    console.log('⚠️  DEVELOPMENT MODE: Configure EMAIL_PROVIDER environment variable for real email sending');
    console.log('='.repeat(80));
  }
}

export const emailService = new EmailService();