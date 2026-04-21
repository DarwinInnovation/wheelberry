/**
 * Admin CLI for managing users, devices, and device tokens.
 *
 * Usage:
 *   npx tsx src/scripts/admin-cli.ts user list
 *   npx tsx src/scripts/admin-cli.ts user add <email> [--name <name>] [--admin]
 *   npx tsx src/scripts/admin-cli.ts user remove <email>
 *
 *   npx tsx src/scripts/admin-cli.ts device list
 *   npx tsx src/scripts/admin-cli.ts device add <app> <uid> <owner-email> [--name <name>] [--config <json>]
 *   npx tsx src/scripts/admin-cli.ts device remove <uid>
 *
 *   npx tsx src/scripts/admin-cli.ts token generate <device-uid> [--label <label>]
 *   npx tsx src/scripts/admin-cli.ts token list [--device <uid>]
 *   npx tsx src/scripts/admin-cli.ts token revoke <token-id>
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { randomBytes, createHash } from 'crypto';
import { default as pino } from 'pino';
import { connectDB, disconnectDB, User, Device, DeviceToken } from '../db/index.js';

const log = pino({ name: 'admin-cli', level: 'info' });

function getArg(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

async function userList() {
  const users = await User.find().sort({ email: 1 });
  if (users.length === 0) {
    console.log('No users.');
    return;
  }
  console.log('Users:');
  for (const u of users) {
    console.log(`  ${u.email}  role=${u.role}  provider=${u.provider}  id=${u._id}`);
  }
}

async function userAdd(args: string[]) {
  const email = args[2];
  if (!email || email.startsWith('--')) {
    console.error('Usage: user add <email> [--name <name>] [--admin]');
    process.exit(1);
  }
  const name = getArg(args, '--name') || email.split('@')[0];
  const role = hasFlag(args, '--admin') ? 'admin' : 'user';

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.error(`User ${email} already exists.`);
    process.exit(1);
  }

  const user = await User.create({
    email: email.toLowerCase(),
    name,
    provider: 'google',
    providerId: 'cli-created',
    role,
  });
  console.log(`Created user: ${user.email} (${user.role})`);
}

async function userRemove(args: string[]) {
  const email = args[2];
  if (!email || email.startsWith('--')) {
    console.error('Usage: user remove <email>');
    process.exit(1);
  }
  const result = await User.deleteOne({ email: email.toLowerCase() });
  if (result.deletedCount === 0) {
    console.error(`User ${email} not found.`);
  } else {
    console.log(`Removed user: ${email}`);
  }
}

async function deviceList() {
  const devices = await Device.find().populate('owner', 'email').sort({ app: 1, uid: 1 });
  if (devices.length === 0) {
    console.log('No devices.');
    return;
  }
  console.log('Devices:');
  for (const d of devices) {
    const ownerEmail = (d.owner as any)?.email || 'unknown';
    console.log(`  ${d.app}/${d.uid}  name="${d.name}"  owner=${ownerEmail}  id=${d._id}`);
  }
}

async function deviceAdd(args: string[]) {
  const app = args[2];
  const uid = args[3];
  const ownerEmail = args[4];
  if (!app || !uid || !ownerEmail) {
    console.error('Usage: device add <app> <uid> <owner-email> [--name <name>] [--config <json>]');
    process.exit(1);
  }

  const owner = await User.findOne({ email: ownerEmail.toLowerCase() });
  if (!owner) {
    console.error(`Owner ${ownerEmail} not found. Create the user first.`);
    process.exit(1);
  }

  const name = getArg(args, '--name') || `${app}/${uid}`;
  const configStr = getArg(args, '--config');
  const config = configStr ? JSON.parse(configStr) : {};

  const device = await Device.create({ app, uid, name, owner: owner._id, config });
  console.log(`Created device: ${device.app}/${device.uid} → ${ownerEmail}`);
}

async function deviceRemove(args: string[]) {
  const uid = args[2];
  if (!uid || uid.startsWith('--')) {
    console.error('Usage: device remove <uid>');
    process.exit(1);
  }
  const result = await Device.deleteOne({ uid });
  if (result.deletedCount === 0) {
    console.error(`Device ${uid} not found.`);
  } else {
    console.log(`Removed device: ${uid}`);
  }
}

async function tokenGenerate(args: string[]) {
  const deviceUid = args[2];
  if (!deviceUid || deviceUid.startsWith('--')) {
    console.error('Usage: token generate <device-uid> [--label <label>]');
    process.exit(1);
  }

  const device = await Device.findOne({ uid: deviceUid });
  if (!device) {
    console.error(`Device ${deviceUid} not found.`);
    process.exit(1);
  }

  const label = getArg(args, '--label') || `token-${Date.now()}`;

  // Generate a cryptographically random token
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');

  await DeviceToken.create({
    tokenHash,
    device: device._id,
    label,
  });

  console.log(`Token generated for device ${deviceUid}:`);
  console.log(`  Label: ${label}`);
  console.log(`  Token: ${rawToken}`);
  console.log('');
  console.log('  ⚠  Save this token now — it cannot be retrieved again.');
}

async function tokenList(args: string[]) {
  const deviceUid = getArg(args, '--device');
  let query: any = {};
  if (deviceUid) {
    const device = await Device.findOne({ uid: deviceUid });
    if (!device) {
      console.error(`Device ${deviceUid} not found.`);
      process.exit(1);
    }
    query.device = device._id;
  }

  const tokens = await DeviceToken.find(query).populate({
    path: 'device',
    select: 'app uid',
  });

  if (tokens.length === 0) {
    console.log('No tokens.');
    return;
  }
  console.log('Tokens:');
  for (const t of tokens) {
    const d = t.device as any;
    const status = t.revoked ? 'REVOKED' : 'active';
    const lastUsed = t.lastUsed ? t.lastUsed.toISOString() : 'never';
    console.log(`  id=${t._id}  device=${d?.app}/${d?.uid}  label="${t.label}"  status=${status}  lastUsed=${lastUsed}`);
  }
}

async function tokenRevoke(args: string[]) {
  const tokenId = args[2];
  if (!tokenId || tokenId.startsWith('--')) {
    console.error('Usage: token revoke <token-id>');
    process.exit(1);
  }

  const token = await DeviceToken.findById(tokenId);
  if (!token) {
    console.error(`Token ${tokenId} not found.`);
    process.exit(1);
  }

  token.revoked = true;
  await token.save();
  console.log(`Token ${tokenId} revoked.`);
}

async function main() {
  const args = process.argv.slice(2);
  const entity = args[0];
  const action = args[1];

  if (!entity || !action) {
    console.error('Usage: admin-cli <user|device|token> <action> [args]');
    process.exit(1);
  }

  await connectDB(log);

  try {
    switch (`${entity} ${action}`) {
      case 'user list': await userList(); break;
      case 'user add': await userAdd(args); break;
      case 'user remove': await userRemove(args); break;
      case 'device list': await deviceList(); break;
      case 'device add': await deviceAdd(args); break;
      case 'device remove': await deviceRemove(args); break;
      case 'token generate': await tokenGenerate(args); break;
      case 'token list': await tokenList(args); break;
      case 'token revoke': await tokenRevoke(args); break;
      default:
        console.error(`Unknown command: ${entity} ${action}`);
        process.exit(1);
    }
  } finally {
    await disconnectDB(log);
  }
}

main().catch((err) => {
  log.error(err, 'CLI error');
  process.exit(1);
});
