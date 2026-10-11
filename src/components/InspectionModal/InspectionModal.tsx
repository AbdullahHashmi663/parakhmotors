'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import type { InspectionPackage, InspectionBooking } from '@/types';
import styles from './InspectionModal.module.css';

interface InspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillCar?: { make: string; model: string; year: number };
}

export const InspectionModal: React.FC<InspectionModalProps> = ({
  isOpen,
  onClose,
  prefillCar,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Lahore');
  const [carMake, setCarMake] = useState(prefillCar?.make || '');
  const [carModel, setCarModel] = useState(prefillCar?.model || '');
  const [carYear, setCarYear] = useState(prefillCar?.year ? String(prefillCar.year) : '2022');
  const [packageType, setPackageType] = useState<InspectionPackage>('comprehensive');
  const [preferredDate, setPreferredDate] = useState('2026-10-15');
  const [locationAddress, setLocationAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBooking, setSuccessBooking] = useState<InspectionBooking | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.inspections.book({
        customerName,
        email,
        phone,
        city,
        carMake,
        carModel,
        carYear: Number(carYear),
        packageType,
        preferredDate,
        locationAddress,
        notes,
      });

      setSuccessBooking(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book inspection');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Book 200+ Point Inspection</h2>
            <p className={styles.subtitle}>
              Certified multi-point vehicle evaluation by master technicians
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {successBooking ? (
          <div className={styles.successBox}>
            <span className={styles.successIcon}>✓</span>
            <h3 className={styles.successTitle}>Inspection Booked Successfully!</h3>
            <p className={styles.successMessage}>
              Booking Reference: <strong>{successBooking.id}</strong>
              <br />
              Package: <strong>{successBooking.packageType.toUpperCase()}</strong> (PKR{' '}
              {successBooking.estimatedFee.toLocaleString()})
              <br />
              Date: <strong>{successBooking.preferredDate}</strong>
              <br />
              Our inspection team will contact you at <strong>{successBooking.phone}</strong> to
              confirm the exact schedule.
            </p>
            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: '16px' }}
              onClick={onClose}
            >
              Done
            </button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '6px',
                  color: '#f87171',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}

            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mehmood"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Email Address (optional)</label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>City *</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="form-input"
                >
                  <option value="Lahore">Lahore</option>
                  <option value="Islamabad">Islamabad / Rawalpindi</option>
                  <option value="Karachi">Karachi</option>
                  <option value="Faisalabad">Faisalabad</option>
                </select>
              </div>
            </div>

            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Car Make & Model *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toyota Prado / Honda Civic"
                  value={carMake ? `${carMake} ${carModel}` : carModel}
                  onChange={(e) => {
                    const parts = e.target.value.split(' ');
                    setCarMake(parts[0] || '');
                    setCarModel(parts.slice(1).join(' ') || '');
                  }}
                  className="form-input"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Car Year *</label>
                <input
                  type="number"
                  min="1990"
                  max="2026"
                  required
                  value={carYear}
                  onChange={(e) => setCarYear(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Select Inspection Package</label>
              <div className={styles.packages}>
                <div
                  className={`${styles.pkgCard} ${
                    packageType === 'basic' ? styles.pkgActive : ''
                  }`}
                  onClick={() => setPackageType('basic')}
                >
                  <div className={styles.pkgName}>Basic</div>
                  <div className={styles.pkgPrice}>PKR 10,000</div>
                </div>

                <div
                  className={`${styles.pkgCard} ${
                    packageType === 'comprehensive' ? styles.pkgActive : ''
                  }`}
                  onClick={() => setPackageType('comprehensive')}
                >
                  <div className={styles.pkgName}>Comprehensive</div>
                  <div className={styles.pkgPrice}>PKR 18,000</div>
                </div>

                <div
                  className={`${styles.pkgCard} ${
                    packageType === 'premium' ? styles.pkgActive : ''
                  }`}
                  onClick={() => setPackageType('premium')}
                >
                  <div className={styles.pkgName}>Premium 200+</div>
                  <div className={styles.pkgPrice}>PKR 28,000</div>
                </div>
              </div>
            </div>

            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Preferred Inspection Date *</label>
                <input
                  type="date"
                  required
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Location / Address</label>
                <input
                  type="text"
                  placeholder="e.g. DHA, Gulberg, Bahria..."
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Specific Concerns or Notes</label>
              <textarea
                placeholder="e.g. Please check engine compression, transmission shifting, and paint depth..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-input"
                style={{ resize: 'vertical', minHeight: '60px' }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`btn-primary ${styles.submitBtn}`}
            >
              {isLoading ? 'Submitting to Backend...' : 'Confirm & Request Inspection'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
