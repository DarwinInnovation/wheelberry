/**
 * One-time migration script: imports users, devices, and configs from
 * cfg/*.json5 files into MongoDB.
 *
 * Usage: npx tsx src/scripts/migrate-config.ts
 *
 * Requires MONGODB_URI env var (or defaults to localhost).
 * Requires an admin user email: ADMIN_EMAIL env var (first user gets admin role).
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { default as pino } from 'pino';
import * as fs from 'fs';
import * as path from 'path';
import json5 from 'json5';
import { connectDB, disconnectDB, User, Device } from '../db/index.js';

const log = pino({ name: 'migrate-config', level: 'info' });

const CFG_DIR = path.join(__dirname, '../../cfg');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

async function migrate() {
  await connectDB(log);

  const files = fs.readdirSync(CFG_DIR).filter((f) => f.endsWith('.json5'));
  log.info(`Found config files: ${files.join(', ')}`);

  for (const file of files) {
    const appName = path.basename(file, '.json5');
    const cfg = json5.parse(fs.readFileSync(path.join(CFG_DIR, file), 'utf8'));

    if (!cfg.users) {
      log.warn(`${file}: no users section, skipping`);
      continue;
    }

    for (const [email, userInfo] of Object.entries<{ uid: string; cfg?: Record<string, unknown> }>(cfg.users)) {
      // Upsert user
      const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      let user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        user = await User.create({
          email: email.toLowerCase(),
          name: email.split('@')[0],
          provider: 'google', // placeholder — will update on first real login
          providerId: 'migrated',
          role: isAdmin ? 'admin' : 'user',
        });
        log.info(`Created user: ${user.email} (${user.role})`);
      }

      // Upsert device
      let device = await Device.findOne({ uid: userInfo.uid });
      if (!device) {
        device = await Device.create({
          app: appName,
          uid: userInfo.uid,
          name: `${appName}/${userInfo.uid}`,
          owner: user._id,
          config: userInfo.cfg || {},
        });
        log.info(`Created device: ${device.app}/${device.uid} → ${user.email}`);
      } else {
        device.config = userInfo.cfg || {};
        device.owner = user._id;
        await device.save();
        log.info(`Updated device: ${device.app}/${device.uid}`);
      }
    }
  }

  log.info('Migration complete');
  await disconnectDB(log);
}

migrate().catch((err) => {
  log.error(err, 'Migration failed');
  process.exit(1);
});
