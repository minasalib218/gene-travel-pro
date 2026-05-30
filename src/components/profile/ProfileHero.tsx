import Image from "next/image";
import Link from "next/link";

type Props = {
  profile: {
    fullName: string;
    country?: string;
    avatarUrl?: string;
  };
  usage: {
    tier: string;
    plansRemaining: number;
  };
};

export default function ProfileHero({ profile, usage }: Props) {
  const isFree = usage.tier === "free";

  return (
    <section className="relative h-[260px] overflow-hidden">
      <Image
        src="/images/profile-hero.jpg"
        alt="Profile background"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-6 pb-8">
        <div className="flex items-center gap-6">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border border-white/20">
            <Image
              src={profile.avatarUrl || "/images/avatar-placeholder.png"}
              alt="Avatar"
              fill
              className="object-cover"
            />
          </div>

          <div>
            <h1 className="text-3xl font-semibold">{profile.fullName}</h1>
            <div className="mt-1 text-sm text-white/70">
              {profile.country || "Traveler"}
            </div>

            <div className="mt-3 inline-flex items-center gap-3 rounded-full bg-black/40 px-4 py-1 text-sm">
              <span className="capitalize">{usage.tier}</span>
              {!isFree && (
                <span className="text-white/60">
                  {usage.plansRemaining} plans left
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="ml-auto">
          {isFree ? (
            <Link
              href="/pricing"
              className="rounded-full bg-[#ff7a00] px-6 py-3 font-semibold text-black"
            >
              Upgrade & Start Planning
            </Link>
          ) : (
            <Link
              href="/ai-planner"
              className="rounded-full bg-[#ff7a00] px-6 py-3 font-semibold text-black"
            >
              Create New Plan
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
