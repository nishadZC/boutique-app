const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const inrCompact = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 });

export const formatCurrency = (value: number) => inr.format(value || 0);
export const formatCompactCurrency = (value: number) => inrCompact.format(value || 0);
export const formatDay = (iso: string, short = false) =>
  new Date(iso).toLocaleDateString('en-IN', short ? { day: 'numeric', month: 'short' } : { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export const shortId = (id: string) => `#${id.slice(0, 8).toUpperCase()}`;
export const customerName = (c?: { firstName?: string; lastName?: string; email?: string } | null) =>
  c ? ([c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || 'Customer') : 'Customer';
export const formatAddress = (a: unknown) =>
  typeof a === 'string' ? a : (a as { address?: string } | null)?.address ?? '';
