'use client';

import React from 'react';
import Image from 'next/image';
import type { Vehicle } from '@/types';
import { formatPKR, formatMileage } from '@/lib/utils';
import styles from './VehicleCard.module.css';

interface VehicleCardProps {
  vehicle: Vehicle;
  onInquire?: (vehicle: Vehicle) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onInquire }) => {
  return (
    <div className={`glass-card ${styles.card}`}>
      <div className={styles.imageWrapper}>
        <Image
          src={vehicle.images[0] || 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80'}
          alt={vehicle.title}
          width={600}
          height={380}
          className={styles.image}
        />

        <div className={styles.overlayBadges}>
          <span className="badge-certified">
            <span>🛡️</span> Verified
          </span>
          <span className="badge-score">
            <span>★</span> {vehicle.inspectionScore}/100
          </span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.brandYear}>
            {vehicle.brand} • {vehicle.year}
          </div>
          <h3 className={styles.title}>{vehicle.title}</h3>
        </div>

        <div className={styles.specs}>
          <div className={styles.specItem}>
            <span className={styles.specLabel}>Mileage</span>
            <span className={styles.specValue}>{formatMileage(vehicle.mileage)}</span>
          </div>
          <div className={styles.specItem}>
            <span className={styles.specLabel}>Fuel</span>
            <span className={styles.specValue} style={{ textTransform: 'capitalize' }}>
              {vehicle.fuelType}
            </span>
          </div>
          <div className={styles.specItem}>
            <span className={styles.specLabel}>Location</span>
            <span className={styles.specValue}>{vehicle.location.split(',')[0]}</span>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.priceWrapper}>
            <span className={styles.priceLabel}>Verified Price</span>
            <span className={styles.price}>{formatPKR(vehicle.price)}</span>
          </div>

          <button
            type="button"
            className={styles.inquireBtn}
            onClick={() => onInquire?.(vehicle)}
          >
            Inquire
          </button>
        </div>
      </div>
    </div>
  );
};
