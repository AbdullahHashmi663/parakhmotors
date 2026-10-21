'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, ArrowUpRight, Lock, RefreshCw, Shield } from 'lucide-react';
import { api } from '@/lib/api-client';
import styles from '@/app/admin/admin.module.css';

type Method = 'password' | 'email' | 'reset';

export function AdminSignIn({ onAuthenticated, notice = '' }: { onAuthenticated: () => void; notice?: string }) {
  const [method, setMethod] = useState<Method>('password');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const choose = (next: Method) => {
    setMethod(next); setChallengeId(''); setCode(''); setPassword(''); setConfirmPassword(''); setError(''); setMessage('');
  };
  async function sendCode() {
    const response = await api.admin.requestCode(username, method === 'reset' ? 'password_reset' : 'login');
    setChallengeId(response.challengeId); setCode(''); setCooldown(60); setMessage(response.message);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(''); setBusy(true);
    try {
      if (method === 'password') { await api.admin.login(username, password); setPassword(''); onAuthenticated(); }
      else if (!challengeId) await sendCode();
      else if (method === 'email') { await api.admin.verifyCode(username, challengeId, code); setCode(''); onAuthenticated(); }
      else {
        const result = await api.admin.resetPassword(username, challengeId, code, password, confirmPassword);
        choose('password'); setMessage(result.message);
      }
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to complete your request. Please try again.'); }
    finally { setBusy(false); }
  }
  async function resend() {
    setError(''); setBusy(true);
    try { await sendCode(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Unable to resend your code.'); }
    finally { setBusy(false); }
  }

  return <div className={styles.loginForm}>
    <div className={styles.loginIcon}><Lock size={25} /></div>
    <span className={styles.eyebrow}>ADMINISTRATOR ACCESS</span>
    <h2>{method === 'reset' ? 'Reset password.' : 'Welcome back.'}</h2>
    <p>{method === 'reset' ? 'Confirm the code sent to your registered email to choose a new password.' : 'Sign in to manage the Parakh Motors experience.'}</p>
    <div className={styles.authMethods} aria-label="Sign-in method">
      <button type="button" aria-pressed={method === 'password'} disabled={busy} onClick={() => choose('password')}>Password</button>
      <button type="button" aria-pressed={method === 'email'} disabled={busy} onClick={() => choose('email')}>Email code</button>
    </div>
    <form onSubmit={submit}>
      <label className={styles.field}><span>Administrator username</span><input className={styles.control} name="username" autoComplete="username" required maxLength={120} value={username} disabled={busy} onChange={event => { setUsername(event.target.value); setChallengeId(''); setCode(''); setMessage(''); setError(''); }} placeholder="Enter your username" autoFocus /></label>
      {method === 'password' && <label className={styles.field}><span>Password</span><input className={styles.control} type="password" name="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></label>}
      {challengeId && <label className={styles.field}><span>Eight-digit email code</span><input className={styles.control} name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" maxLength={8} required value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ''))} aria-describedby="admin-code-help" /><small id="admin-code-help" className={styles.fieldHint}>Valid for 10 minutes. Each code works once.</small></label>}
      {method === 'reset' && challengeId && <>
        <label className={styles.field}><span>New password</span><input className={styles.control} name="new-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={event => setPassword(event.target.value)} /><small className={styles.fieldHint}>Use at least 12 characters.</small></label>
        <label className={styles.field}><span>Confirm new password</span><input className={styles.control} name="confirm-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label>
      </>}
      {(message || notice) && <p id="admin-auth-error" className={styles.authMessage} role="status">{message || notice}</p>}
      {error && <p className={styles.formError} role="alert"><AlertCircle size={17} />{error}</p>}
      <button data-motion-press className={styles.primaryButton} type="submit" disabled={busy || (method !== 'password' && !challengeId && cooldown > 0)}>{busy ? <><RefreshCw className={styles.spin} size={17} />Please wait…</> : <>{method === 'password' ? 'Enter the studio' : !challengeId ? 'Email me a code' : method === 'reset' ? 'Update password' : 'Sign in with code'}<ArrowUpRight size={19} /></>}</button>
      {challengeId && <button type="button" className={styles.authLink} disabled={busy || cooldown > 0} onClick={resend}>{cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}</button>}
    </form>
    <button className={styles.authLink} type="button" disabled={busy} onClick={() => choose(method === 'reset' ? 'password' : 'reset')}>{method === 'reset' ? 'Back to sign in' : 'Forgot your password?'}</button>
    <div className={styles.loginFine}><Shield size={15} /><span>Secure access for the dealership team.</span></div>
  </div>;
}
