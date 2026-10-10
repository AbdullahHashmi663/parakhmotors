'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { formatPKR } from '@/lib/utils';
import type { SellCarRequest } from '@/types';
import styles from './SellCarSection.module.css';

export const SellCarSection: React.FC = () => {
  const [sellerName, setSellerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Lahore');
  const [brand, setBrand] = useState('Mercedes-Benz');
  const [model, setModel] = useState('C-Class');
  const [year, setYear] = useState('2021');
  const [mileage, setMileage] = useState('35000');
  const [expectedPrice, setExpectedPrice] = useState('18000000');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SellCarRequest | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.sellRequests.submit({
        sellerName,
        phone,
        email,
        city,
        brand,
        model,
        year: Number(year),
        mileage: Number(mileage),
        expectedPrice: Number(expectedPrice),
      });

      setResult(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Valuation request failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="sell-car" className={styles.section}>
      <div className="container">
        <div className={styles.wrapper}>
          <div className={styles.info}>
            <span className={styles.tag}>Sell With Parakh Motors</span>
            <h2 className={styles.heading}>
              Get The Maximum Value For Your Luxury Vehicle
            </h2>
            <p className={styles.desc}>
              Skip tire-kickers and lowballers. Parakh Motors handles the certified inspection,
              photography, verified listing, and escrow facilitation directly with pre-approved
              buyers.
            </p>

            <div className={styles.features}>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>✓</span>
                <span>Immediate data-backed algorithmic market evaluation</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>✓</span>
                <span>Doorstep multi-point inspection & digital certificate</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>✓</span>
                <span>Secure bank transfer & instant transfer guarantee</span>
              </div>
            </div>
          </div>

          <div className={styles.formCard}>
            <h3 className={styles.formTitle}>Instant Valuation Request</h3>
            <p className={styles.formSubtitle}>
              Directly powered by our Next.js Route Handler (/api/sell-requests)
            </p>

            {error && (
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  marginBottom: '12px',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label className={styles.label}>Brand</label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Model</label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label className={styles.label}>Year</label>
                  <input
                    type="number"
                    min="1995"
                    max="2026"
                    required
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Mileage (km)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Expected Asking Price (PKR)</label>
                <input
                  type="number"
                  min="100000"
                  required
                  value={expectedPrice}
                  onChange={(e) => setExpectedPrice(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label className={styles.label}>Your Name</label>
                  <input
                    type="text"
                    required
                    value={sellerName}
                    placeholder="e.g. Asad"
                    onChange={(e) => setSellerName(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    placeholder="0300..."
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label className={styles.label}>Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    placeholder="seller@example.com"
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="form-input"
                  >
                    <option value="Lahore">Lahore</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Karachi">Karachi</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{ width: '100%', marginTop: '6px' }}
              >
                {isLoading ? 'Calculating Valuation...' : 'Get Valuation & Sell'}
              </button>
            </form>

            {result && (
              <div className={styles.valuationResult}>
                <div className={styles.valuationLabel}>Estimated Market Value Range</div>
                <div className={styles.valuationAmount}>
                  {formatPKR(result.estimatedMarketValueMin)} —{' '}
                  {formatPKR(result.estimatedMarketValueMax)}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>
                  Request logged (#{result.id}). A valuation specialist will call {result.phone}{' '}
                  for scheduling your inspection.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
