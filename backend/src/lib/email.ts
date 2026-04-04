import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM || 'InterVista <noreply@intervista.app>';

export async function sendOTPEmail(to: string, otp: string): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'InterVista — Password Reset Code',
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#1f2937;font-size:24px;margin:0;">🎯 InterVista</h1>
          <p style="color:#6b7280;font-size:14px;">AI-Powered Mock Interviews</p>
        </div>
        <h2 style="color:#1f2937;font-size:20px;">Password Reset</h2>
        <p style="color:#4b5563;line-height:1.6;">
          You requested a password reset. Use this verification code:
        </p>
        <div style="text-align:center;margin:24px 0;">
          <span style="display:inline-block;padding:16px 32px;background:#f97316;color:#ffffff;font-size:32px;font-weight:bold;letter-spacing:8px;border-radius:8px;">
            ${otp}
          </span>
        </div>
        <p style="color:#6b7280;font-size:13px;">
          This code expires in 15 minutes. If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendSessionCompleteEmail(
  to: string,
  userName: string,
  role: string,
  score: number,
  recommendation: string
): Promise<void> {
  const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `InterVista — Your ${role} Interview Results`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#1f2937;font-size:24px;margin:0;">🎯 InterVista</h1>
        </div>
        <h2 style="color:#1f2937;font-size:20px;">Hi ${userName}!</h2>
        <p style="color:#4b5563;line-height:1.6;">
          Your <strong>${role}</strong> interview has been evaluated by our AI.
        </p>
        <div style="text-align:center;margin:24px 0;">
          <div style="display:inline-block;width:100px;height:100px;border-radius:50%;background:${scoreColor};color:#ffffff;font-size:36px;font-weight:bold;line-height:100px;">
            ${score}
          </div>
          <p style="color:#4b5563;margin-top:8px;font-size:16px;font-weight:600;">${recommendation}</p>
        </div>
        <p style="color:#4b5563;line-height:1.6;">
          Log in to see your detailed feedback, strengths, and areas for improvement.
        </p>
        <div style="text-align:center;margin-top:24px;">
          <a href="${process.env.CORS_ORIGINS || 'http://localhost:3000'}/dashboard" 
             style="display:inline-block;padding:12px 32px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
            View Full Results
          </a>
        </div>
      </div>
    `,
  });
}
