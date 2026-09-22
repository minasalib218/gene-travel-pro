import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#050505] px-5 py-24 text-white">
      <section className="mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-white/[0.05] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="text-xs uppercase tracking-[0.32em] text-[#ffb066]">Page not found</div>
        <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-5xl">This Gene page is not available.</h1>
        <p className="mt-4 text-sm leading-7 text-white/68">
          The link may be private, unpublished, expired, or moved. You can continue from one of the main public areas.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/ready-plans" className="rounded-full bg-[#ff7a00] px-5 py-3 text-sm font-semibold text-black">
            Ready Plans
          </Link>
          <Link href="/destinations" className="rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-sm text-white">
            Destinations
          </Link>
          <Link href="/pricing" className="rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-sm text-white">
            AI Planner
          </Link>
        </div>
      </section>
    </main>
  );
}
