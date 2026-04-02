import sanitizeHtml from 'sanitize-html';

/**
 * Strips ALL HTML tags and attributes from a string.
 * Returns plain text only.
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

/**
 * Sanitizes specific string fields on an object.
 * Mutates and returns the object.
 */
export function sanitizeFields<T extends Record<string, any>>(
  obj: T,
  keys: (keyof T)[]
): T {
  for (const key of keys) {
    if (typeof obj[key] === 'string') {
      (obj as any)[key] = sanitizeString(obj[key] as string);
    }
  }
  return obj;
}
