import Image from "next/image";
import Link from "next/link";

export function PolicyPageShell({
  eyebrow,
  title,
  updatedAt,
  sections,
}: {
  eyebrow: string;
  title: string;
  updatedAt: string;
  sections: Array<{ heading: string; body: string[] }>;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/signup-bg-editorial.jpg"
          alt="Gene Travel cinematic background"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/82 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,122,0,0.16),transparent_48%)]" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/35 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center">
            <Image src="/images/logo.png" alt="Gene Travel" width={180} height={180} />
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Back to sign up
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="rounded-[30px] border border-white/12 bg-black/38 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.52)] backdrop-blur-2xl md:p-8 lg:p-10">
          <div className="text-[11px] uppercase tracking-[0.3em] text-[#ffb066]">{eyebrow}</div>
          <h1 className="mt-4 text-3xl font-semibold md:text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-white/58">Last updated: {updatedAt}</p>

          <div className="mt-8 space-y-6">
            {sections.map((section) => (
              <article
                key={section.heading}
                className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
              >
                <h2 className="text-lg font-medium text-white">{section.heading}</h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-white/72">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
