import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { NextRequest } from 'next/server.js';
import { databaseConfig } from './database-config.mjs';
import { hashAdminPassword } from '../src/backend/passwords.ts';

databaseConfig();
process.env.TRUST_PROXY = 'true';
process.env.NODE_ENV = 'production';
const root = path.resolve('.next/admin-auth-verification');
const modules = [
  'backend/passwords', 'backend/database', 'backend/admin-accounts', 'backend/auth',
  'backend/utils/api-error', 'backend/utils/api-response', 'backend/utils/validation',
  'app/api/admin/session/route',
];
const generated = [];
const modulePath = name => path.join(root, name.replaceAll('/', '-') + '.mjs');
await mkdir(root, { recursive: true });
for (const name of modules) {
  const original = path.resolve(`src/${name}.ts`);
  const source = await readFile(original, 'utf8');
  let code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  code = code.replace(/import ['"]server-only['"];?/g, '');
  code = code.replace(/from (['"])([^'"]+)\1/g, (match, _quote, specifier) => {
    if (specifier === 'next/server') return 'from "next/server.js"';
    if (!specifier.startsWith('.') && !specifier.startsWith('@/')) return match;
    const resolved = specifier.startsWith('@/') ? specifier.slice(2) : path.relative(path.resolve('src'), path.resolve(path.dirname(original), specifier)).replaceAll('\\', '/');
    assert.ok(modules.includes(resolved), `Unmapped test import ${resolved}`);
    return 'from ' + JSON.stringify(pathToFileURL(modulePath(resolved)).href);
  });
  await writeFile(modulePath(name), code);
  generated.push(modulePath(name));
}

const accounts = await import(pathToFileURL(modulePath('backend/admin-accounts')).href);
const auth = await import(pathToFileURL(modulePath('backend/auth')).href);
const route = await import(pathToFileURL(modulePath('app/api/admin/session/route')).href);
const { getDatabasePool } = await import(pathToFileURL(modulePath('backend/database')).href);
const pool = getDatabasePool();
const suffix = randomUUID();
const username = `auth-test-${suffix}`;
const id = `auth-test-${suffix}`;
const password = `Initial-${randomUUID()}`;
const nextPassword = `Updated-${randomUUID()}`;
const emails = [];
const originalFetch = globalThis.fetch;
let tests = 0;
globalThis.fetch = async (url, options) => {
  assert.equal(url, 'https://api.resend.com/emails');
  const body = JSON.parse(options.body);
  assert.deepEqual(body.to, ['auth-fixture@example.invalid']);
  const code = body.text.match(/Use (\d{8})/)[1];
  emails.push({ code, subject: body.subject });
  return new Response(JSON.stringify({ id: randomUUID() }), { status: 200 });
};
const request = (body, cookie) => new NextRequest('https://parakhmotors.com/api/admin/session', {
  method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', Origin: 'https://parakhmotors.com', 'x-forwarded-for': suffix, ...(cookie ? { Cookie: cookie } : {}) },
  ...(body ? { body: JSON.stringify(body) } : {}),
});
async function post(body, expected = 200) {
  const response = await route.POST(request({ username, ...body }));
  assert.equal(response.status, expected);
  tests++;
  return { response, data: await response.json() };
}
async function newCode(purpose) {
  await pool.query("UPDATE public.admin_auth_challenges SET created_at = NOW() - INTERVAL '2 minutes' WHERE account_id = $1", [id]);
  return accounts.requestAdminCode(username, purpose);
}

try {
  await pool.query('INSERT INTO public.admin_accounts (id, username, password_hash, recovery_email) VALUES ($1,$2,$3,$4)', [id, username, await hashAdminPassword(password), 'auth-fixture@example.invalid']);
  const login = await post({ password });
  const cookie = login.response.headers.get('set-cookie').split(';')[0];
  for (const flag of [/HttpOnly/i, /Secure/i, /SameSite=strict/i]) assert.match(login.response.headers.get('set-cookie'), flag);
  assert.equal((await (await route.GET(request(undefined, cookie))).json()).authenticated, true); tests++;
  await auth.requireAdmin(request(undefined, cookie)); tests++;
  await post({ username: 'nonexistent-' + suffix, password }, 401);
  await post({ password: 'wrong-password' }, 401);
  const crossOrigin = request({ username, password });
  crossOrigin.headers.set('origin', 'https://untrusted.invalid');
  assert.equal((await route.POST(crossOrigin)).status, 403); tests++;
  assert.equal((await (await route.GET(request(undefined, 'pm_admin_session=forged'))).json()).authenticated, false); tests++;

  const codeRequest = await post({ action: 'request_code', purpose: 'login' });
  const challenge = codeRequest.data.challengeId;
  const code = emails.at(-1).code;
  assert.ok(!JSON.stringify(codeRequest.data).includes(code)); tests++;
  const stored = (await pool.query('SELECT code_hash FROM public.admin_auth_challenges WHERE id = $1', [challenge])).rows[0].code_hash;
  assert.ok(stored !== code && stored.length === 64); tests++;
  await post({ action: 'request_code', purpose: 'login' }, 429);
  assert.equal(await accounts.consumeAdminCode(username, challenge, code, 'password_reset', nextPassword), null); tests++;
  await post({ action: 'verify_code', challengeId: challenge, code });
  await post({ action: 'verify_code', challengeId: challenge, code }, 401);

  const expiring = await newCode('login');
  const expiredCode = emails.at(-1).code;
  await pool.query("UPDATE public.admin_auth_challenges SET expires_at = NOW() - INTERVAL '1 second' WHERE id = $1", [expiring]);
  assert.equal(await accounts.consumeAdminCode(username, expiring, expiredCode, 'login'), null); tests++;
  const exhausted = await newCode('login');
  const validCode = emails.at(-1).code;
  const incorrectCode = validCode === '00000000' ? '11111111' : '00000000';
  for (let i = 0; i < 5; i++) assert.equal(await accounts.consumeAdminCode(username, exhausted, incorrectCode, 'login'), null);
  assert.equal(await accounts.consumeAdminCode(username, exhausted, validCode, 'login'), null); tests++;

  const reset = await newCode('password_reset');
  const resetCode = emails.at(-1).code;
  assert.equal(await accounts.consumeAdminCode(username, reset, resetCode, 'login'), null); tests++;
  await post({ action: 'reset_password', challengeId: reset, code: resetCode, newPassword: nextPassword, confirmPassword: nextPassword });
  assert.equal((await (await route.GET(request(undefined, cookie))).json()).authenticated, false); tests++;
  await assert.rejects(auth.requireAdmin(request(undefined, cookie)), error => error.statusCode === 401); tests++;
  assert.equal(await accounts.verifyAdminCredentials(username, password), null); tests++;
  assert.ok(await accounts.verifyAdminCredentials(username, nextPassword)); tests++;
  assert.equal(await accounts.consumeAdminCode(username, reset, resetCode, 'password_reset', password), null); tests++;
  const concurrent = await newCode('login');
  const concurrentCode = emails.at(-1).code;
  const results = await Promise.all([accounts.consumeAdminCode(username, concurrent, concurrentCode, 'login'), accounts.consumeAdminCode(username, concurrent, concurrentCode, 'login')]);
  assert.equal(results.filter(Boolean).length, 1); tests++;
  for (let i = 0; i < 3; i++) await accounts.checkPersistentAuthLimit('verification-test', suffix, 3);
  await assert.rejects(accounts.checkPersistentAuthLimit('verification-test', suffix, 3), e => e.statusCode === 429); tests++;

  const client = await pool.connect();
  try {
    for (const role of ['anon', 'authenticated']) for (const table of ['admin_accounts', 'admin_auth_challenges', 'admin_auth_limits']) {
      await client.query('BEGIN');
      await client.query(`SET LOCAL ROLE ${role}`);
      await assert.rejects(client.query(`SELECT * FROM public.${table}`), e => e.code === '42501'); tests++;
      await client.query('ROLLBACK');
    }
  } finally { await client.query('ROLLBACK').catch(() => {}); client.release(); }
  console.log(JSON.stringify({ adminAuthChecks: tests, emailDelivery: 'mocked', replayBlocked: true, sessionRevocation: true, privateTables: true }));
} finally {
  globalThis.fetch = originalFetch;
  await pool.query('DELETE FROM public.admin_accounts WHERE id = $1', [id]);
  const keys = [
    ['sign-in-client', createHash('sha256').update(suffix).digest('hex')],
    ['sign-in-account', username], ['sign-in-account', 'nonexistent-' + suffix],
    ['email-request-client', createHash('sha256').update(suffix).digest('hex')], ['email-request-account', username], ['verification-test', suffix],
  ].map(([scope, identifier]) => createHash('sha256').update(`${scope}:${identifier}`).digest('hex'));
  await pool.query('DELETE FROM public.admin_auth_limits WHERE key = ANY($1::text[])', [keys]);
  await pool.end();
  for (const file of generated) await unlink(file);
}
