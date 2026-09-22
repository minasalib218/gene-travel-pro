export type ControlCentreFeature =
  | "controlCentre"
  | "realityCheck"
  | "bookingTracking"
  | "packing"
  | "collaboration"
  | "dailyTripMode";

const ENV_KEYS: Record<ControlCentreFeature, string> = {
  controlCentre: "GENE_CONTROL_CENTRE_ENABLED",
  realityCheck: "GENE_REALITY_CHECK_ENABLED",
  bookingTracking: "GENE_BOOKING_TRACKING_ENABLED",
  packing: "GENE_PACKING_ENABLED",
  collaboration: "GENE_TRIP_COLLABORATION_ENABLED",
  dailyTripMode: "GENE_DAILY_TRIP_MODE_ENABLED",
};

export function isControlCentreFeatureEnabled(feature: ControlCentreFeature) {
  return process.env[ENV_KEYS[feature]]?.trim().toLowerCase() === "true";
}

