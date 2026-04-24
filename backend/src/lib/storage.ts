import * as admin from 'firebase-admin';
import logger from './logger';

/**
 * Upload an audio buffer to Firebase Storage.
 * Returns the public download URL.
 */
export async function uploadAudioToStorage(
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<string> {
  const bucket = admin.storage().bucket();
  const file = bucket.file(`audio/${filename}`);

  await file.save(buffer, {
    metadata: {
      contentType: mimetype,
    },
    resumable: false,
  });

  // Make publicly accessible and return URL
  await file.makePublic();
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/audio/${filename}`;

  logger.info(`Audio uploaded to Firebase Storage: ${filename}`);
  return publicUrl;
}

/**
 * Delete an audio file from Firebase Storage.
 */
export async function deleteAudioFromStorage(filename: string): Promise<void> {
  try {
    const bucket = admin.storage().bucket();
    await bucket.file(`audio/${filename}`).delete();
    logger.info(`Audio deleted from Firebase Storage: ${filename}`);
  } catch (err) {
    logger.error(`Failed to delete audio from storage: ${filename}`, err);
  }
}
