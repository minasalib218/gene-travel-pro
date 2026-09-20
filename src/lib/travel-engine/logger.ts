type TravelLogLevel = "info" | "warn" | "error";

export function logTravelEngine(
  level: TravelLogLevel,
  event: string,
  details: Record<string, unknown>,
) {
  const payload = {
    scope: "travel-engine",
    event,
    level,
    timestamp: new Date().toISOString(),
    ...details,
  };

  if (level === "error") {
    console.error(payload);
    return;
  }
  if (level === "warn") {
    console.warn(payload);
    return;
  }
  console.info(payload);
}
