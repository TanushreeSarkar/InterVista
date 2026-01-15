import { getStorage } from '../db/firestore';
import { v4 as uuidv4 } from 'uuid';

export async function uploadFileToStorage(file: Express.Multer.File, path: string): Promise<string> {
    const storage = getStorage();
    const bucket = storage.bucket();
    const filename = `${path}/${uuidv4()}-${file.originalname}`;
    const fileUpload = bucket.file(filename);

    const stream = fileUpload.createWriteStream({
        metadata: {
            contentType: file.mimetype,
        },
    });

    return new Promise((resolve, reject) => {
        stream.on('error', (error) => {
            console.error('Storage upload error:', error);
            reject(error);
        });

        stream.on('finish', async () => {
            // Make the file public
            try {
                await fileUpload.makePublic();
                // Return the public URL
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
                resolve(publicUrl);
            } catch (error) {
                // If makePublic fails (e.g. permission denied), return a signed URL or just the format
                console.warn("Could not make file public, using unsigned URL pattern");
                resolve(`https://storage.googleapis.com/${bucket.name}/${filename}`);
            }
        });

        stream.end(file.buffer);
    });
}
