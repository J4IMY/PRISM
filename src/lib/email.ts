import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;
let etherealReady: Promise<void> | null = null;

function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export function isConsoleMailer(): boolean {
  if (isSmtpConfigured()) return false;
  if (isResendConfigured()) return false;
  if (process.env.SMTP_FORCE === "true") return false;
  return true;
}

export function isDevEnvironment(): boolean {
  return (process.env.NODE_ENV || "development") === "development";
}

function logConsoleEmail(options: EmailOptions, label = "email"): void {
  const linkMatch = options.text.match(/https?:\/\/\S+/);
  console.log("\n══════════════════════════════════════════════════");
  console.log(`📧 PRISM ${label} (dev — console only, no SMTP)`);
  console.log(`   To:      ${options.to}`);
  console.log(`   Subject: ${options.subject}`);
  if (linkMatch) {
    console.log(`   Link:    ${linkMatch[0]}`);
  }
  console.log("══════════════════════════════════════════════════\n");
}

async function ensureTransporter() {
  if (transporter) return transporter;

  if (!isSmtpConfigured()) {
    if (!etherealReady) {
      etherealReady = nodemailer.createTestAccount().then((account) => {
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: { user: account.user, pass: account.pass },
        });
        console.log("\n📧 PRISM dev email: using Ethereal test account (SMTP_FORCE=true)");
        console.log(`   User: ${account.user}`);
        console.log(`   Pass: ${account.pass}\n`);
      });
    }
    await etherealReady;
    return transporter!;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

async function sendViaResend(options: EmailOptions): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "noreply@prism.local",
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend email failed (${res.status}): ${body.slice(0, 200)}`);
  }
}

export async function sendEmail(options: EmailOptions, label = "email"): Promise<void> {
  if (isConsoleMailer()) {
    logConsoleEmail(options, label);
    return;
  }

  if (isResendConfigured()) {
    await sendViaResend(options);
    return;
  }

  const transport = await ensureTransporter();
  const nodeEnv = process.env.NODE_ENV || "development";

  const info = await transport.sendMail({
    from: process.env.EMAIL_FROM || "noreply@prism.local",
    ...options,
  });

  if (nodeEnv === "development") {
    const preview = nodemailer.getTestMessageUrl(info);
    console.log("\n══════════════════════════════════════════════════");
    console.log("📧 PRISM email (dev — SMTP)");
    console.log(`   To:      ${options.to}`);
    console.log(`   Subject: ${options.subject}`);
    if (preview) {
      console.log(`   Preview: ${preview}`);
    }
    const linkMatch = options.text.match(/https?:\/\/\S+/);
    if (linkMatch) {
      console.log(`   Link:    ${linkMatch[0]}`);
    }
    console.log("══════════════════════════════════════════════════\n");
  }
}

export async function sendVerificationEmail(
  email: string,
  verificationUrl: string,
  name?: string,
): Promise<void> {
  const appName = process.env.APP_NAME || "PRISM";
  const greeting = name ? `Hi ${name}` : "Hi there";

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

  await sendEmail(
    {
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
    },
    "verification",
  );
}
