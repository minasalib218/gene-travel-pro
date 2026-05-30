export function AdminPageHeader({
  eyebrow = "Admin",
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <div className="text-[11px] uppercase tracking-[0.26em] text-[#ffb066]">{eyebrow}</div>
      <h1 className="mt-2 text-3xl font-semibold text-white">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-white/60">{description}</p>
    </div>
  );
}
