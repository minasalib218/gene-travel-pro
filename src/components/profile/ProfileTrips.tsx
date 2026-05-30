import Link from "next/link";

type Trip = {
  id: string;
  title: string;
  destination: string;
};

export default function ProfileTrips({ trips }: { trips: Trip[] }) {
  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold">Confirmed Trips</h2>

      {trips.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          You haven’t confirmed any trips yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="rounded-2xl border border-white/10 bg-black/30 p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-medium">{trip.title}</div>
                  <div className="text-sm text-white/60">
                    {trip.destination}
                  </div>
                </div>

                <Link
                  href={`/plan/${trip.id}`}
                  className="text-sm text-[#ff7a00]"
                >
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
