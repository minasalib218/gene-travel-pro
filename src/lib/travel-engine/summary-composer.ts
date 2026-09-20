import type { RecommendationPayload } from "@/lib/recommendation/types";

export function composeTravelSummary(payload: RecommendationPayload) {
  const bookingState = payload.summaryState?.bookingState;
  const warnings = payload.analysis.filter((item) => item.status !== "good").map((item) => item.text);
  return {
    destination: payload.inputs.destination,
    travelDates: {
      startDate: payload.inputs.startDate,
      endDate: payload.inputs.endDate,
    },
    selections: bookingState?.items || [],
    bookingStatus: bookingState?.totals || null,
    keyNotes: warnings,
    lastValidatedAt: new Date().toISOString(),
  };
}
