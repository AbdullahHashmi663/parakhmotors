import { randomBytes, scrypt as deriveKey, timingSafeEqual } from 'node:crypto';

const options = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const derive = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) => {
  deriveKey(password, salt, 64, options, (error, key) => error ? reject(error) : resolve(key));
});

export async function hashAdminPassword(password: string): Promise<string> {
  const salt = randomBytes(24).toString('hex');
  return `scrypt$${salt}$${(await derive(password, salt)).toString('hex')}`;
}

export async function matchesAdminPassword(password: string, stored: string): Promise<boolean> {
  const match = /^scrypt\$([a-f0-9]{48})\$([a-f0-9]{128})$/.exec(stored);
  if (!match) return false;
  return timingSafeEqual(await derive(password, match[1]), Buffer.from(match[2], 'hex'));
}
