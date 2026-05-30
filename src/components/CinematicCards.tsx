import Link from "next/link";

type CardProps = {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  href?: string;
  rightMeta?: React.ReactNode;
};

export function CinematicCard({
  title,
  subtitle,
  imageUrl,
  href,
  rightMeta,
}: CardProps) {
  const content = (
    <div className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.07]">
      <div className="relative h-44 w-full overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,122,0,.25),transparent_40%),linear-gradient(180deg,#1f1f1f,#0d0d0d)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-white">{title}</div>
            {subtitle ? <div className="mt-1 text-sm text-white/65">{subtitle}</div> : null}
          </div>
          {rightMeta}
        </div>
      </div>
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}