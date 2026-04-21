import mongoose from 'mongoose';
import { Logger } from 'pino';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wheelberry';

export async function connectDB(log: Logger): Promise<typeof mongoose> {
  log.info(`Connecting to MongoDB at ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//<credentials>@')}`);
  const conn = await mongoose.connect(MONGODB_URI);
  log.info('MongoDB connected');
  return conn;
}

export async function disconnectDB(log: Logger): Promise<void> {
  await mongoose.disconnect();
  log.info('MongoDB disconnected');
}
