'use client';

import { useState, type FormEvent } from 'react';
import { api } from '@/lib/api-client';
import type { Vehicle } from '@/types';
import styles from './VehicleEnquiryForm.module.css';

export function VehicleEnquiryForm({ vehicle }: { vehicle: Vehicle }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setError('');
    try {
      await api.inquiries.create({
        name: String(data.get('name') || '').trim(),
        phone: String(data.get('phone') || '').trim(),
        email: String(data.get('email') || '').trim(),
        message: String(data.get('message') || '').trim() || `I'd like to know more about ${vehicle.title}.`,
        type: 'vehicle',
        vehicleId: vehicle.id,
      });
      setMessage('Thanks. Your enquiry was sent to our team.');
      form.reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Please try again. Your enquiry could not be sent.');
    } finally {
      setPending(false);
    }
  }

  return <section id="enquire" className={styles.panel} aria-labelledby="enquire-title">
    <h2 id="enquire-title">Enquire about this car</h2>
    <p>Share your details and our team will contact you about this specific vehicle.</p>
    {message ? <p className={styles.success} role="status">{message}</p> : <form onSubmit={submit}>
      <label>Your name<input name="name" required minLength={2} autoComplete="name" /></label>
      <label>Phone / WhatsApp<input name="phone" type="tel" required minLength={10} maxLength={20} autoComplete="tel" placeholder="03XX XXXXXXX" /></label>
      <label>Email address (optional)<input name="email" type="email" autoComplete="email" /></label>
      <label>Message<textarea name="message" rows={3} placeholder={`I'd like to know more about the ${vehicle.title}.`} /></label>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button type="submit" disabled={pending}>{pending ? 'Sending…' : 'Send enquiry'}</button>
    </form>}
  </section>;
}
