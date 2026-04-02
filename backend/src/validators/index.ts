import { z } from 'zod';

// ─── Shared patterns ──────────────────────────────────────
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least 1 number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least 1 special character');

const emailSchema = z
  .string()
  .email('Invalid email address')
  .transform((v) => v.toLowerCase().trim());

const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be at most 50 characters')
  .trim();

const difficultyEnum = z.enum(['Easy', 'Medium', 'Hard']);

const personaIdEnum = z.enum(['alex', 'morgan', 'jordan', 'casey']).optional();

// ─── Auth ─────────────────────────────────────────────────
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});

export const signinSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const verifyResetSchema = z.object({
  email: emailSchema,
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  newPassword: passwordSchema,
});

// ─── Sessions ─────────────────────────────────────────────
export const createSessionSchema = z.object({
  role: z
    .string()
    .min(2, 'Role must be at least 2 characters')
    .max(100, 'Role must be at most 100 characters')
    .trim(),
  company: z
    .string()
    .min(2, 'Company must be at least 2 characters')
    .max(100, 'Company must be at most 100 characters')
    .trim(),
  difficulty: difficultyEnum,
  personaId: personaIdEnum,
  questionBankId: z.string().optional(),
});

// ─── Answers ──────────────────────────────────────────────
export const submitAnswerSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  questionId: z.string().min(1, 'questionId is required'),
  questionIndex: z.union([z.string(), z.number()]).transform((v) => {
    const num = typeof v === 'string' ? parseInt(v) : v;
    return isNaN(num) ? 0 : num;
  }),
  text: z
    .string()
    .max(5000, 'Transcript must be at most 5000 characters')
    .optional()
    .default(''),
});

// ─── Users ────────────────────────────────────────────────
export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  targetRole: z
    .string()
    .max(100, 'Target role must be at most 100 characters')
    .optional(),
  targetCompany: z
    .string()
    .max(100, 'Target company must be at most 100 characters')
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

// ─── Question Banks ───────────────────────────────────────
export const createQuestionBankSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  description: z.string().max(500).optional().default(''),
  questions: z
    .array(
      z
        .string()
        .min(10, 'Each question must be at least 10 characters')
        .max(500, 'Each question must be at most 500 characters')
    )
    .min(1, 'At least 1 question is required')
    .max(50, 'At most 50 questions allowed'),
});

export const updateQuestionBankSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim()
    .optional(),
  description: z.string().max(500).optional(),
  questions: z
    .array(
      z
        .string()
        .min(10, 'Each question must be at least 10 characters')
        .max(500, 'Each question must be at most 500 characters')
    )
    .min(1)
    .max(50)
    .optional(),
});

// ─── TTS ──────────────────────────────────────────────────
export const ttsSchema = z.object({
  text: z
    .string()
    .min(1, 'Text is required')
    .max(5000, 'Text must be at most 5000 characters'),
  sessionId: z.string().optional(),
});
