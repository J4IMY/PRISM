import nodemailer from 'nodemailer';

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!transporter) {
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    if (nodeEnv === 'development') {
      // Use Ethereal Email for testing in development
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Use production SMTP
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }
  
  return transporter;
}

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const transporter = getTransporter();
  
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@prism.local',
    ...options,
  });
}

export async function sendVerificationEmail(
  email: string,
  verificationUrl: string,
  name?: string
): Promise<void> {
  const appName = process.env.APP_NAME || 'PRISM';
  const greeting = name ? `Hi ${name}` : 'Hi there';
  
  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>${greeting},</h2>
      <p>Thanks for signing up to ${appName}! Please verify your email address by clicking the button below:</p>
      
      <div style="margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email
        </a>
      </div>
      
      <p>Or copy this link: <a href="${verificationUrl}">${verificationUrl}</a></p>
      
      <p>This link will expire in 24 hours.</p>
      
      <p>If you didn't create this account, you can ignore this email.</p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">
        © ${new Date().getFullYear()} ${appName}. All rights reserved.
      </p>
    </div>
  </body>
</html>
  `;

  await sendEmail({
    to: email,
    subject: `Verify your email for ${appName}`,
    text: `
${greeting},

Thanks for signing up to ${appName}! Please verify your email by visiting this link:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create this account, ignore this email.
    `.trim(),
    html,
  });
}
