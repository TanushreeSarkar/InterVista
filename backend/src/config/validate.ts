/**
 * Validates that all required environment variables are set.
 * Exits the process with code 1 if any are missing or invalid.
 */
export function validateEnv(): void {
  const required: string[] = [
    'PORT',
    'NODE_ENV',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'CORS_ORIGINS',
    'GROQ_API_KEY',
    'OPENAI_API_KEY',
  ];

  // SMTP vars are optional — warn if missing but don't crash
  const smtpVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `\n❌ FATAL: Missing required environment variables:\n` +
        missing.map((key) => `   - ${key}`).join('\n') +
        `\n\nPlease set them in your .env file or environment.\n` +
        `See .env.example for documentation on each variable.\n`
    );
    process.exit(1);
  }

  // Validate JWT_SECRET minimum length
  const jwtSecret = process.env.JWT_SECRET!;
  if (jwtSecret.length < 32) {
    console.error(
      `\n❌ FATAL: JWT_SECRET must be at least 32 characters long.\n` +
        `   Current length: ${jwtSecret.length}\n` +
        `   Generate one with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"\n`
    );
    process.exit(1);
  }

  // Warn about missing SMTP vars
  const missingSmtp = smtpVars.filter((key) => !process.env[key]);
  if (missingSmtp.length > 0) {
    console.warn(
      `\n⚠️  WARNING: Missing SMTP environment variables:\n` +
        missingSmtp.map((key) => `   - ${key}`).join('\n') +
        `\n   Email features (OTP, session notifications) will be DISABLED.\n`
    );
  }
}
