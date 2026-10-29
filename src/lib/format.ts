const nf = new Intl.NumberFormat('fr-FR');

export const money = (value: unknown): string =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(value) || 0)} FCFA`;

export const number = (value: unknown): string => nf.format(Number(value) || 0);

export const compactMoney = (value: unknown): string => {
  const n = Math.round(Number(value) || 0);
  if (Math.abs(n) >= 1000000) {
    return `${nf.format(Math.round((n / 1000000) * 100) / 100)} M FCFA`;
  }
  if (Math.abs(n) >= 10000) return `${nf.format(Math.round(n / 1000))} k FCFA`;
  return `${nf.format(n)} FCFA`;
};

export const compactNumber = (value: unknown): string => {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 1000000) return `${nf.format(Math.round((n / 1000000) * 10) / 10)} M`;
  if (Math.abs(n) >= 1000) return `${nf.format(Math.round(n / 100) / 10)} k`;
  return nf.format(n);
};

export const pctLabel = (value: unknown): string => {
  const n = Math.round((Number(value) || 0) * 10) / 10;
  return `${n > 0 ? '+' : ''}${nf.format(n)} %`;
};

export const dateFr = (value?: string | number | Date | null): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
};

export const dateShort = (value?: string | number | Date | null): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(d);
};

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export const periodLabel = (period?: string | null): string => {
  if (!period) return '—';
  const [year, month] = String(period).split('-');
  return `${MONTHS[Number(month) - 1] || month} ${year}`;
};

export const monthName = (index: number): string => MONTHS[index] || '';

export const todayISO = (): string => new Date().toISOString().slice(0, 10);

export const daysBetween = (from: string | number | Date, to: string | number | Date = new Date()): number => {
  const a = new Date(from);
  const b = new Date(to);
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
};