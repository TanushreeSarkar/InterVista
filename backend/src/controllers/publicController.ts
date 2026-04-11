import { Request, Response } from 'express';
import { getDb } from '../db/firestore';
import { successResponse, errorResponse } from '../lib/apiResponse';

export const subscribeNewsletter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json(errorResponse('BAD_REQUEST', 'Email is required'));
      return;
    }

    await getDb().collection('newsletter_subscribers').add({
      email,
      subscribedAt: new Date(),
    });

    res.status(200).json(successResponse({ success: true }));
  } catch (error: any) {
    res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to subscribe', error.message));
  }
};

export const submitContactForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      res.status(400).json(errorResponse('BAD_REQUEST', 'Name, email, and message are required'));
      return;
    }

    await getDb().collection('contact_messages').add({
      name,
      email,
      message,
      submittedAt: new Date(),
      status: 'new'
    });

    res.status(200).json(successResponse({ success: true }));
  } catch (error: any) {
    res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to submit contact form', error.message));
  }
};
