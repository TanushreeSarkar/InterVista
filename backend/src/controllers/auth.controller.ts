import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getFirestore, collections } from '../db/firestore';
import { generateToken } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

export async function signUp(req: Request, res: Response) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      throw new AppError('Email, password, and name are required', 400);
    }

    const db = getFirestore();
    
    // Check if user exists
    const existingUser = await db
      .collection(collections.users)
      .where('email', '==', email)
      .get();

    if (!existingUser.empty) {
      throw new AppError('User already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    const user = {
      id: userId,
      email,
      name,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection(collections.users).doc(userId).set(user);

    // Generate token
    const token = generateToken({ id: userId, email });

    res.status(201).json({
      user: {
        id: userId,
        email,
        name,
      },
      token,
    });
  } catch (error) {
    throw error;
  }
}

export async function signIn(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const db = getFirestore();
    
    // Find user
    const userSnapshot = await db
      .collection(collections.users)
      .where('email', '==', email)
      .get();

    if (userSnapshot.empty) {
      throw new AppError('Invalid credentials', 401);
    }

    const userData = userSnapshot.docs[0].data();

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token
    const token = generateToken({ id: userData.id, email: userData.email });

    res.json({
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
      },
      token,
    });
  } catch (error) {
    throw error;
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const db = getFirestore();
    
    // Check if user exists
    const userSnapshot = await db
      .collection(collections.users)
      .where('email', '==', email)
      .get();

    if (userSnapshot.empty) {
      // Don't reveal if user exists
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // In production, send actual reset email
    // For now, just return success
    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    throw error;
  }
}