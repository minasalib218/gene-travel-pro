import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/payments", label: "Payments & Passes" },
  { href: "/admin/passes", label: "Pass Controls" },
  { href: "/admin/ready-plans", label: "Ready Plans" },
  { href: "/admin/destinations", label: "Destinations" },
  { href: "/admin/offers", label: "Offers" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/ai-monitoring", label: "AI Monitoring" },
  { href: "/admin/api-health", label: "API Health" },
  { href: "/admin/affiliate-links", label: "Affiliate Links" },
  { href: "/admin/traffic", label: "Traffic Analytics" },
  { href: "/admin/errors", label: "Errors & Logs" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminCookie = cookies().get("admin_auth")?.value;
  if (adminCookie !== "1") {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-[#060606] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,122,0,0.14),transparent_18%),linear-gradient(180deg,#0b0b0b,#050505)]" />
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(115deg,rgba(255,122,0,0.06),transparent_30%,transparent_72%,rgba(255,255,255,0.03))]" />

      <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-8">
        <div className="overflow-hidden rounded-[36px] border border-white/10 bg-black/35 shadow-[0_32px_120px_rgba(0,0,0,0.48)] backdrop-blur-2xl">
          <div className="border-b border-white/10 px-5 py-5 md:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.28em] text-[#ffbf82]">
                  Gene Admin Shell
                </div>
                <h1 className="mt-2 text-3xl font-semibold">Operations Console</h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-white/62">
                  Full access to content, users, payments, passes, AI monitoring, affiliate operations, and internal trip-engine controls.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/ai-planner"
                  className="rounded-2xl bg-[#ff7a00] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#ff922f]"
                >
                  Open AI Planner
                </Link>
                <form action="/api/admin/logout" method="post">
                  <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 transition hover:bg-white/10">
                    Logout
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
            <aside className="border-b border-white/10 bg-white/[0.03] p-4 lg:border-b-0 lg:border-r lg:border-white/10 lg:p-5">
              <div className="rounded-[26px] border border-white/10 bg-black/25 p-4">
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#ffbf82]">Navigation</div>
                <nav className="mt-4 space-y-2">
                  {NAV_ITEMS.map((item) => (
                    <AdminLink key={item.href} href={item.href} label={item.label} />
                  ))}
                </nav>
              </div>

              <div className="mt-4 rounded-[26px] border border-white/10 bg-black/25 p-4 text-sm text-white/60">
                Admin bypass is enabled here, so the team can inspect AI pages and summary flows without the traveler payment gate.
              </div>
            </aside>

            <section className="p-5 md:p-6">{children}</section>
          </div>
        </div>
      </div>
    </main>
  );
}

function AdminLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
    >
      {label}
    </Link>
  );
}
