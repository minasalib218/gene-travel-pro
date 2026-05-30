import type { UserTripInput, VisaEntryAnalysis } from "@/lib/recommendation/types";

const env = {
  visa: process.env.VISA_API_KEY,
  travelAdvisory: process.env.TRAVEL_ADVISORY_API_KEY,
  healthAdvisory: process.env.HEALTH_ADVISORY_API_KEY,
  timatic: process.env.IATA_TIMATIC_API_KEY,
  sherpa: process.env.SHERPA_API_KEY,
};

type VisaEntryContext = {
  passportCountry?: string;
  destinationCountries: string[];
  transitCountries: string[];
  tripStartDate: string;
  tripEndDate: string;
  passportExpiryDate?: string;
  travelerType: string;
  familyFlags: string[];
};

function hasOfficialVisaApi() {
  return Boolean(env.visa || env.travelAdvisory || env.healthAdvisory || env.timatic || env.sherpa);
}

function normalizeCountryLabel(value: string) {
  return value.trim();
}

function buildDestinationCountries(input: UserTripInput) {
  const fromStops = (input.destinations || []).map((item) => item.country).filter(Boolean).map(normalizeCountryLabel);
  if (fromStops.length) return Array.from(new Set(fromStops));
  return input.destination ? [normalizeCountryLabel(input.destination.split(",").slice(-1)[0] || input.destination)] : [];
}

export function buildVisaEntryContext(plannerInput: UserTripInput): VisaEntryContext {
  return {
    passportCountry: plannerInput.passportCountry || undefined,
    destinationCountries: buildDestinationCountries(plannerInput),
    transitCountries: (plannerInput.transitCountries || []).map(normalizeCountryLabel).filter(Boolean),
    tripStartDate: plannerInput.startDate,
    tripEndDate: plannerInput.endDate,
    passportExpiryDate: plannerInput.passportExpiryDate || undefined,
    travelerType: plannerInput.travelerType,
    familyFlags: [
      plannerInput.kids ? "kids" : "",
      plannerInput.elderly ? "elderly" : "",
      plannerInput.travelerType === "family" ? "family" : "",
    ].filter(Boolean),
  };
}

export function checkPassportValidity(passportExpiryDate?: string, tripEndDate?: string) {
  if (!passportExpiryDate || !tripEndDate) {
    return {
      valid: false,
      withinSixMonths: false,
      message: "Passport expiry date missing. Official verification required.",
    };
  }
  const expiry = new Date(passportExpiryDate);
  const tripEnd = new Date(tripEndDate);
  if (Number.isNaN(expiry.getTime()) || Number.isNaN(tripEnd.getTime())) {
    return {
      valid: false,
      withinSixMonths: false,
      message: "Passport dates could not be verified. Official verification required.",
    };
  }
  const sixMonthsAfterTrip = new Date(tripEnd);
  sixMonthsAfterTrip.setMonth(sixMonthsAfterTrip.getMonth() + 6);
  const withinSixMonths = expiry < sixMonthsAfterTrip;
  return {
    valid: !withinSixMonths,
    withinSixMonths,
    message: withinSixMonths
      ? "Passport should usually remain valid for at least 6 months after trip end."
      : "Passport validity appears safer against the common 6-month rule.",
  };
}

export function detectTransitVisaRisk(transitCountries: string[], passportCountry?: string) {
  if (!transitCountries.length) {
    return ["No transit countries added."];
  }
  if (!passportCountry) {
    return transitCountries.map(
      (country) => `Transit in ${country} needs official checking because passport country is missing.`,
    );
  }
  return transitCountries.map(
    (country) => `Layover in ${country} may require transit permission depending on ${passportCountry} passport rules.`,
  );
}

export function normalizeVisaApiResult(apiResult: Partial<VisaEntryAnalysis>): VisaEntryAnalysis {
  return {
    destinationCountry: apiResult.destinationCountry || "",
    passportCountry: apiResult.passportCountry,
    transitCountries: apiResult.transitCountries || [],
    visaRequired: apiResult.visaRequired || "unknown",
    entryRestrictions: apiResult.entryRestrictions || [],
    vaccinationRules: apiResult.vaccinationRules || [],
    transitVisaNotes: apiResult.transitVisaNotes || [],
    passportValidityRule: apiResult.passportValidityRule || "Official passport-validity check required.",
    customsNotes: apiResult.customsNotes || [],
    requiredDocuments: apiResult.requiredDocuments || [],
    confidence: apiResult.confidence || 40,
    lastChecked: apiResult.lastChecked,
    aiSummary: apiResult.aiSummary || "Entry rules can change quickly. Confirm with the official embassy/airline before booking.",
    warnings: apiResult.warnings || [],
    sourceStatus: apiResult.sourceStatus || "missing-data",
    countryBreakdown: apiResult.countryBreakdown || [],
  };
}

export function buildVisaEntryPrompt(context: VisaEntryContext) {
  return `Generate a Smart Visa & Entry Assistant analysis using the traveler’s passport country, destination country, transit countries, trip dates, passport expiry date, and traveler profile. Explain visa requirement possibility, entry restrictions, vaccination/health rules, transit visa risk, passport validity, customs notes, and required documents. If official API data is missing, lower confidence and clearly say the traveler must verify with embassy/airline. Do not invent exact legal guarantees.\nContext: ${JSON.stringify(context)}`;
}

export function generateVisaEntryAnalysis(plannerInput: UserTripInput): VisaEntryAnalysis {
  const context = buildVisaEntryContext(plannerInput);
  const hasApi = hasOfficialVisaApi();
  const hasPassport = Boolean(context.passportCountry);
  const hasDestination = context.destinationCountries.length > 0;
  const passportCheck = checkPassportValidity(context.passportExpiryDate, context.tripEndDate);
  const transitVisaNotes = detectTransitVisaRisk(context.transitCountries, context.passportCountry);
  const multipleCountries = context.destinationCountries.length > 1;

  if (!hasDestination) {
    return normalizeVisaApiResult({
      destinationCountry: "",
      passportCountry: context.passportCountry,
      transitCountries: context.transitCountries,
      visaRequired: "unknown",
      entryRestrictions: [],
      vaccinationRules: ["Destination country missing, so no final visa or entry result can be produced."],
      transitVisaNotes,
      passportValidityRule: passportCheck.message,
      customsNotes: [],
      requiredDocuments: ["Passport", "Return/onward travel proof", "Accommodation details"],
      confidence: 18,
      aiSummary: "Destination country is missing, so Gene cannot finalize entry guidance yet.",
      warnings: ["Add the destination country before relying on entry guidance.", "Entry rules can change quickly. Confirm with the official embassy/airline before booking."],
      sourceStatus: "missing-data",
    });
  }

  const visaRequired: VisaEntryAnalysis["visaRequired"] =
    !hasPassport
      ? "unknown"
      : multipleCountries
      ? "unknown"
      : hasApi
      ? "unknown"
      : plannerInput.tripPersonality?.includes("Famous Places")
      ? "evisa"
      : "unknown";

  const entryRestrictions = [
    multipleCountries ? "Multi-destination route means each country may apply different entry conditions." : "",
    context.familyFlags.length ? "Carry supporting documents for all travelers, especially minors or elderly travelers who may need medical/support records." : "",
  ].filter(Boolean);

  const vaccinationRules = [
    "Verify official health and vaccination requirements before departure.",
    plannerInput.elderly || plannerInput.kids ? "Carry age-related medication and health documentation if needed." : "",
  ].filter(Boolean);

  const customsNotes = [
    "Check local customs limits for medicines, electronics, and restricted items.",
    multipleCountries ? "Customs allowances can differ by country on a multi-stop route." : "",
  ].filter(Boolean);

  const requiredDocuments = [
    "Valid passport",
    "Flight / onward travel confirmation",
    "Accommodation confirmation",
    visaRequired === "evisa" ? "eVisa approval if required" : "",
    context.transitCountries.length ? "Transit itinerary details" : "",
  ].filter(Boolean);

  const countryBreakdown = context.destinationCountries.map((country) => ({
    country,
    visaRequired,
    note: country === context.destinationCountries[0]
      ? "Primary destination entry check."
      : "Additional stop with separate entry conditions to verify.",
  }));

  let confidence = hasApi ? 78 : 56;
  if (!hasPassport) confidence -= 24;
  if (passportCheck.withinSixMonths) confidence -= 10;
  if (context.transitCountries.length) confidence -= 6;
  if (multipleCountries) confidence -= 6;
  confidence = Math.max(18, Math.min(88, confidence));

  const warnings = [
    !hasPassport ? "Passport country missing; official visa result cannot be finalized." : "",
    passportCheck.withinSixMonths ? "Passport may expire too close to trip end." : "",
    context.transitCountries.length ? "Transit visa rules may apply on layover countries." : "",
    "Entry rules can change quickly. Confirm with the official embassy/airline before booking.",
  ].filter(Boolean);

  const destinationCountryLabel = multipleCountries ? context.destinationCountries.join(", ") : context.destinationCountries[0] || "";
  const aiSummary = multipleCountries
    ? `Gene prepared entry guidance for ${context.destinationCountries.length} countries on this route. Verify each stop separately, especially transit and passport-validity rules.`
    : `${destinationCountryLabel} entry appears to need a careful pre-booking check, especially for passport validity${context.transitCountries.length ? ", transit conditions" : ""}, and official visa confirmation.`;

  return normalizeVisaApiResult({
    destinationCountry: destinationCountryLabel,
    passportCountry: context.passportCountry,
    transitCountries: context.transitCountries,
    visaRequired,
    entryRestrictions,
    vaccinationRules,
    transitVisaNotes,
    passportValidityRule: passportCheck.message,
    customsNotes,
    requiredDocuments,
    confidence,
    lastChecked: new Date().toISOString(),
    aiSummary,
    warnings,
    sourceStatus: hasApi ? "api" : "ai-generated-with-disclaimer",
    countryBreakdown,
  });
}
