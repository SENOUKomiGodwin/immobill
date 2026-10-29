import { statusMeta } from '@/lib/rent';

export default function StatusPill({ status }) {
  const meta = statusMeta[status] || statusMeta.pending;
  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-bold ${meta.className}`}>{meta.label}</span>
  );
}