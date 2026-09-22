import Link from "next/link";

export default function BookingUnavailablePage() {
  return (
    <main className="min-h-screen bg-[#090909] px-4 py-20 text-white">
      <section className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-5 h-12 w-12 rounded-full border border-[#ff7a00]/60 bg-[#ff7a00]/10" />
        <h1 className="text-2xl font-semibold">Booking link unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-white/65">
          This provider link is unavailable or could not be verified safely. No booking was created.
        </p>
        <Link
          href="/ready-plans"
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#ff7a00] px-6 text-sm font-bold text-white transition hover:bg-[#ff8d22]"
        >
          Explore ready plans
        </Link>
      </section>
    </main>
  );
}
