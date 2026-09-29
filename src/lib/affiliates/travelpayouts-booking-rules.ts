export function normalizeTravelpayoutsSubId(value: string | null) {
  if (!value) return null;
  const match = value.match(/gene_[A-Za-z0-9_-]+/);
  return match?.[0]?.slice(0, 64) ?? null;
}

export function mapTravelpayoutsBookingStatus(value: string | null) {
  const state = (value || "").toLowerCase();
  if (["paid", "confirmed", "approved", "completed"].includes(state)) return "PROVIDER_CONFIRMED";
  if (["cancelled", "canceled", "rejected", "declined"].includes(state)) return "CANCELLED";
  if (["processing", "pending", "hold", "booked"].includes(state)) return "BOOKING_PENDING";
  return "UNKNOWN";
}
