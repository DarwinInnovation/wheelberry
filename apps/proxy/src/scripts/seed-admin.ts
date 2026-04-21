/**
 * Seed an admin user in the database.
 *
 * Usage: npx tsx src/scripts/seed-admin.ts <email> [name]
 *
 * The user will be created with role: 'admin' and provider: 'google' (placeholder).
 * On first OAuth login, the provider and providerId will be updated.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { default as pino } from 'pino';
import { connectDB, disconnectDB, User } from '../db/index.js';

const log = pino({ name: 'seed-admin', level: 'info' });

async function seed() {
  const email = process.argv[2];
  const name = process.argv[3] || email?.split('@')[0] || 'Admin';

  if (!email) {
    console.error('Usage: npx tsx src/scripts/seed-admin.ts <email> [name]');
    process.exit(1);
  }

  await connectDB(log);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    existing.role = 'admin';
    await existing.save();
    log.info(`User ${email} already exists — promoted to admin`);
  } else {
    await User.create({
      email: email.toLowerCase(),
      name,
      provider: 'google',
      providerId: 'seeded',
      role: 'admin',
    });
    log.info(`Admin user created: ${email}`);
  }

  await disconnectDB(log);
}

seed().catch((err) => {
  log.error(err, 'Seed failed');
  process.exit(1);
});
