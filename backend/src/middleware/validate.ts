import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware factory: validates req.body against a Zod schema.
 * Returns 400 with flattened errors on failure.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const flattened = result.error.flatten();
      res.status(400).json({
        error: 'Validation failed',
        details: {
          fieldErrors: flattened.fieldErrors,
          formErrors: flattened.formErrors,
        },
      });
      return;
    }

    // Replace body with parsed (and potentially transformed) data
    req.body = result.data;
    next();
  };
}
