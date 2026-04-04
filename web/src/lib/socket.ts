import { io } from 'socket.io-client';

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const socket = io(NEXT_PUBLIC_API_URL, {
  withCredentials: true,
  autoConnect: false,
});
