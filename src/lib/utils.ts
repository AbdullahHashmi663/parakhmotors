export function formatPKR(amount: number): string {
  if (amount >= 10000000) {
    const crore = amount / 10000000;
    return `PKR ${crore % 1 === 0 ? crore.toFixed(0) : crore.toFixed(2)} Crore`;
  }
  if (amount >= 100000) {
    const lakh = amount / 100000;
    return `PKR ${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2)} Lac`;
  }
  return `PKR ${amount.toLocaleString()}`;
}

export function formatMileage(km: number): string {
  return `${km.toLocaleString()} km`;
}

export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
