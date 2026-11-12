export interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface MailerConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class Mailer {
  private config: MailerConfig;

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || "smtp.example.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "user@example.com",
        pass: process.env.SMTP_PASS || "password",
      },
    };
  }

  async sendMail(options: MailOptions): Promise<boolean> {
    // When nodemailer is installed, transporter.sendMail(options) will be invoked here.
    console.log(`✉️ [MAIL DISPATCHED] To: ${options.to} | Subject: "${options.subject}"`);
    if (options.text) {
      console.log(`📄 Message Body:\n${options.text}`);
    }
    return true;
  }
}

export const mailer = new Mailer();
