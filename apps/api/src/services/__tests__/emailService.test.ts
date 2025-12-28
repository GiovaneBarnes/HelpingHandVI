import { EmailService, emailService } from '../emailService';

// Import the mock
const mockSendGrid = require('../__mocks__/@sendgrid/mail').default;

describe('EmailService', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    originalEnv = { ...process.env };
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleLogSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should default to console provider when no EMAIL_PROVIDER is set', () => {
      delete process.env.EMAIL_PROVIDER;
      const service = new EmailService();
      expect((service as any).provider).toBe('console');
    });

    it('should use EMAIL_PROVIDER environment variable', () => {
      process.env.EMAIL_PROVIDER = 'sendgrid';
      const service = new EmailService();
      expect((service as any).provider).toBe('sendgrid');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct content', async () => {
      const email = 'test@example.com';
      const resetToken = 'test-reset-token';

      await emailService.sendPasswordResetEmail(email, resetToken);

      expect(consoleLogSpy).toHaveBeenCalledWith('='.repeat(80));
      expect(consoleLogSpy).toHaveBeenCalledWith('📧 EMAIL WOULD BE SENT (using console provider)');
      expect(consoleLogSpy).toHaveBeenCalledWith(`To: ${email}`);
      expect(consoleLogSpy).toHaveBeenCalledWith('Subject: Password Reset - HelpingHandVI');
    });

    it('should use custom FRONTEND_URL if provided', async () => {
      process.env.FRONTEND_URL = 'https://custom-domain.com';
      const email = 'test@example.com';
      const resetToken = 'test-token';

      await emailService.sendPasswordResetEmail(email, resetToken);

      // The console output should contain the custom URL
      const calls = consoleLogSpy.mock.calls.flat();
      const textContent = calls.find(call => typeof call === 'string' && call.includes('TEXT VERSION'));
      expect(textContent).toBeDefined();
    });
  });

  describe('sendEmail', () => {
    it('should route to console provider by default', async () => {
      const options = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text'
      };

      await emailService.sendEmail(options);

      expect(consoleLogSpy).toHaveBeenCalledWith('='.repeat(80));
      expect(consoleLogSpy).toHaveBeenCalledWith('📧 EMAIL WOULD BE SENT (using console provider)');
    });

    it('should send email via SendGrid successfully', async () => {
      process.env.EMAIL_PROVIDER = 'sendgrid';
      process.env.SENDGRID_API_KEY = 'test-api-key';
      process.env.FROM_EMAIL = 'test@helpinghandvi.com';

      const service = new EmailService();
      const options = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text'
      };

      await service.sendEmail(options);

      expect(mockSendGrid.setApiKey).toHaveBeenCalledWith('test-api-key');
      expect(mockSendGrid.send).toHaveBeenCalledWith({
        to: 'test@example.com',
        from: 'test@helpinghandvi.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text'
      });
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Password reset email sent to test@example.com via SendGrid');
    });

    it('should throw error for SendGrid without API key', async () => {
      process.env.EMAIL_PROVIDER = 'sendgrid';
      delete process.env.SENDGRID_API_KEY;

      const service = new EmailService();
      const options = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text'
      };

      await expect(service.sendEmail(options)).rejects.toThrow('SENDGRID_API_KEY environment variable is required');
    });

    it('should throw error for unimplemented SES provider', async () => {
      process.env.EMAIL_PROVIDER = 'ses';

      const service = new EmailService();
      const options = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text'
      };

      await expect(service.sendEmail(options)).rejects.toThrow('AWS SES not implemented yet');
    });

    it('should throw error for unimplemented SMTP provider', async () => {
      process.env.EMAIL_PROVIDER = 'smtp';

      const service = new EmailService();
      const options = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text'
      };

      await expect(service.sendEmail(options)).rejects.toThrow('SMTP not implemented yet');
    });
  });

  describe('sendToConsole', () => {
    it('should log email details to console', async () => {
      const options = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
        text: 'Test text content'
      };

      await (emailService as any).sendToConsole(options);

      expect(consoleLogSpy).toHaveBeenCalledWith('='.repeat(80));
      expect(consoleLogSpy).toHaveBeenCalledWith('📧 EMAIL WOULD BE SENT (using console provider)');
      expect(consoleLogSpy).toHaveBeenCalledWith(`To: ${options.to}`);
      expect(consoleLogSpy).toHaveBeenCalledWith(`Subject: ${options.subject}`);
      expect(consoleLogSpy).toHaveBeenCalledWith(`HTML Length: ${options.html.length} characters`);
      expect(consoleLogSpy).toHaveBeenCalledWith(`Text Length: ${options.text.length} characters`);
      expect(consoleLogSpy).toHaveBeenCalledWith('');
      expect(consoleLogSpy).toHaveBeenCalledWith('TEXT VERSION:');
      expect(consoleLogSpy).toHaveBeenCalledWith('-'.repeat(40));
      expect(consoleLogSpy).toHaveBeenCalledWith(options.text);
      expect(consoleLogSpy).toHaveBeenCalledWith('⚠️  DEVELOPMENT MODE: Configure EMAIL_PROVIDER environment variable for real email sending');
    });
  });

  describe('HTML and text content generation', () => {
    it('should generate proper HTML content for password reset', () => {
      const resetLink = 'https://example.com/reset?token=abc123';
      const html = (emailService as any).getPasswordResetHtml(resetLink);

      expect(html).toContain('HelpingHandVI');
      expect(html).toContain('Reset Your Password');
      expect(html).toContain(resetLink);
      expect(html).toContain('This link will expire in 1 hour');
    });

    it('should generate proper text content for password reset', () => {
      const resetLink = 'https://example.com/reset?token=abc123';
      const text = (emailService as any).getPasswordResetText(resetLink);

      expect(text).toContain('HelpingHandVI - Password Reset');
      expect(text).toContain('You requested a password reset for your HelpingHandVI account');
      expect(text).toContain(resetLink);
      expect(text).toContain('This link will expire in 1 hour');
    });
  });
});