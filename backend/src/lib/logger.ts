import winston from 'winston';
import path from 'path';

// ─── Sensitive data filter ─────────────────────────────────
const SENSITIVE_KEYS = [
  'password', 'passwordHash', 'newPassword', 'currentPassword',
  'token', 'jwt', 'secret', 'apiKey', 'api_key',
  'otp', 'privateKey', 'private_key',
  'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'JWT_SECRET',
  'SMTP_PASS', 'FIREBASE_PRIVATE_KEY',
  'authorization', 'cookie',
];

function redactSensitive(info: winston.Logform.TransformableInfo): winston.Logform.TransformableInfo {
  const msg = info.message;
  if (typeof msg === 'string') {
    let redacted = msg;
    for (const key of SENSITIVE_KEYS) {
      // Redact key=value patterns
      const regex = new RegExp(`(${key})[=:]["']?[^"'\\s,;}{\\]]*`, 'gi');
      redacted = redacted.replace(regex, `$1=[REDACTED]`);
    }
    info.message = redacted;
  }
  return info;
}

const redactFormat = winston.format((info) => redactSensitive(info));

// ─── Log directory ─────────────────────────────────────────
const LOG_DIR = path.join(__dirname, '..', '..', 'logs');

// ─── Create logger ─────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';

const transports: winston.transport[] = [];

if (isProduction) {
  // Production: JSON format to files
  transports.push(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    })
  );
} else {
  // Development: colorized console
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    redactFormat(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    isProduction
      ? winston.format.json()
      : winston.format.printf(({ timestamp, level, message, stack }) => {
        return stack
          ? `${timestamp} ${level}: ${message}\n${stack}`
          : `${timestamp} ${level}: ${message}`;
      })
  ),
  transports,
  // Don't exit on unhandled errors
  exitOnError: false,
});

export default logger;
