import 'server-only';
import { createHash, createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { getDatabasePool, databaseTransaction } from './database';
import { matchesAdminPassword, hashAdminPassword } from './passwords';
import { ApiError } from './utils/api-error';

export type AdminAccount = { id: string; username: string; password_hash: string; recovery_email: string; credential_version: number };
export type CodePurpose = 'login' | 'password_reset';

export async function getAdminAccount(username: string): Promise<AdminAccount | undefined> {
  return (await getDatabasePool().query('SELECT * FROM public.admin_accounts WHERE username = $1', [username.toLowerCase().trim()])).rows[0];
}

export async function verifyAdminCredentials(username: string, password: string): Promise<AdminAccount | null> {
  const account = await getAdminAccount(username);
  // Perform the same expensive password derivation for unknown usernames.
  const dummy = 'scrypt$' + '0'.repeat(48) + '$' + '0'.repeat(128);
  const valid = await matchesAdminPassword(password, account?.password_hash || dummy);
  return account && valid ? account : null;
}

export async function checkPersistentAuthLimit(scope: string, identifier: string, maximum: number): Promise<void> {
  const key = createHash('sha256').update(`${scope}:${identifier}`).digest('hex');
  const result = await getDatabasePool().query(`INSERT INTO public.admin_auth_limits (key, attempts, expires_at)
    VALUES ($1, 1, NOW() + INTERVAL '15 minutes') ON CONFLICT (key) DO UPDATE SET
    attempts = CASE WHEN admin_auth_limits.expires_at <= NOW() THEN 1 ELSE admin_auth_limits.attempts + 1 END,
    expires_at = CASE WHEN admin_auth_limits.expires_at <= NOW() THEN NOW() + INTERVAL '15 minutes' ELSE admin_auth_limits.expires_at END
    RETURNING attempts`, [key]);
  if (result.rows[0].attempts > maximum) throw new ApiError('Too many attempts. Please try again in 15 minutes.', 429, 'RATE_LIMITED');
}

const codeDigest = (id: string, code: string) => {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new ApiError('Administrative access is not configured', 503, 'ADMIN_UNAVAILABLE');
  return createHmac('sha256', secret).update(`${id}:${code}`).digest('hex');
};

async function sendCode(email: string, code: string, purpose: CodePurpose, id: string) {
  const key = process.env.RESEND_API_KEY;
  const sender = process.env.ADMIN_FROM_EMAIL;
  if (!key || !sender) throw new ApiError('Email sign-in is not configured yet. Please use your password.', 503, 'EMAIL_UNAVAILABLE');
  const action = purpose === 'login' ? 'sign in' : 'reset your administrator password';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': `admin-code-${id}` },
    body: JSON.stringify({
      from: `Parakh Motors Administration <${sender}>`, to: [email],
      subject: purpose === 'login' ? 'Your Parakh Motors sign-in code' : 'Reset your Parakh Motors password',
      text: `Use ${code} to ${action}. This code expires in 10 minutes and can only be used once. If you did not request this, ignore this email.`,
      html: `<div style="background:#EADCC8;padding:40px;font-family:Arial,sans-serif;color:#6B1F2A"><h1>Parakh Motors Administration</h1><p>Use this code to ${action}:</p><p style="font-size:36px;letter-spacing:8px;font-weight:bold">${code}</p><p>Expires in 10 minutes. This code can only be used once.</p><p>If you did not request this, ignore this email.</p></div>`,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new ApiError('We could not send the code. Please try again shortly or use your password.', 503, 'EMAIL_UNAVAILABLE');
}

export async function requestAdminCode(username: string, purpose: CodePurpose): Promise<string> {
  const id = randomUUID();
  const account = await getAdminAccount(username);
  if (!account) return id;
  const code = String(randomInt(100000000)).padStart(8, '0');
  await databaseTransaction(async db => {
    await db.query('SELECT id FROM public.admin_accounts WHERE id = $1 FOR UPDATE', [account.id]);
    const recent = await db.query(`SELECT id FROM public.admin_auth_challenges WHERE account_id = $1 AND purpose = $2 AND created_at > NOW() - INTERVAL '60 seconds' LIMIT 1`, [account.id, purpose]);
    if (recent.rowCount) throw new ApiError('Please wait one minute before requesting another code.', 429, 'RATE_LIMITED');
    await db.query('UPDATE public.admin_auth_challenges SET consumed_at = NOW() WHERE account_id = $1 AND purpose = $2 AND consumed_at IS NULL', [account.id, purpose]);
    await db.query(`INSERT INTO public.admin_auth_challenges (id, account_id, purpose, code_hash, credential_version, expires_at)
      VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '10 minutes')`, [id, account.id, purpose, codeDigest(id, code), account.credential_version]);
  });
  try { await sendCode(account.recovery_email, code, purpose, id); }
  catch (error) {
    await getDatabasePool().query('UPDATE public.admin_auth_challenges SET consumed_at = NOW() WHERE id = $1', [id]);
    throw error;
  }
  return id;
}

export async function consumeAdminCode(username: string, id: string, code: string, purpose: CodePurpose, newPassword?: string): Promise<AdminAccount | null> {
  const passwordHash = newPassword === undefined ? undefined : await hashAdminPassword(newPassword);
  return databaseTransaction(async db => {
    const account = (await db.query('SELECT * FROM public.admin_accounts WHERE username = $1 FOR UPDATE', [username.toLowerCase().trim()])).rows[0] as AdminAccount | undefined;
    if (!account) return null;
    const challenge = (await db.query(`SELECT * FROM public.admin_auth_challenges WHERE id = $1 AND account_id = $2 AND purpose = $3
      AND consumed_at IS NULL AND expires_at > NOW() AND attempts < 5 AND credential_version = $4 FOR UPDATE`, [id, account.id, purpose, account.credential_version])).rows[0];
    if (!challenge) return null;
    await db.query('UPDATE public.admin_auth_challenges SET attempts = attempts + 1 WHERE id = $1', [id]);
    const expected = Buffer.from(challenge.code_hash, 'hex');
    const supplied = Buffer.from(codeDigest(id, code), 'hex');
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
    await db.query('UPDATE public.admin_auth_challenges SET consumed_at = NOW() WHERE id = $1', [id]);
    if (purpose === 'password_reset') {
      if (!passwordHash) throw ApiError.badRequest('A new password is required');
      const updated = await db.query(`UPDATE public.admin_accounts SET password_hash = $1, credential_version = credential_version + 1, updated_at = NOW() WHERE id = $2 RETURNING *`, [passwordHash, account.id]);
      await db.query('UPDATE public.admin_auth_challenges SET consumed_at = NOW() WHERE account_id = $1 AND consumed_at IS NULL', [account.id]);
      return updated.rows[0] as AdminAccount;
    }
    return account;
  });
}
