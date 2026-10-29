export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="card-surface flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF1FE] text-[#0A24E9]">
        {Icon ? <Icon className="h-6 w-6" strokeWidth={1.8} /> : null}
      </div>
      <p className="text-[15px] font-bold">{title}</p>
      {description && <p className="mt-1 max-w-[380px] text-[13px] leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}