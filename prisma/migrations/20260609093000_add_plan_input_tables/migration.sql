-- CreateTable
CREATE TABLE IF NOT EXISTS "PlanInput" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "destination" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "departureCity" TEXT NOT NULL,
    "isFlexibleDates" BOOLEAN NOT NULL DEFAULT false,
    "travelersCount" INTEGER NOT NULL,
    "travelersType" TEXT NOT NULL,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "kids" INTEGER NOT NULL DEFAULT 0,
    "elderly" INTEGER NOT NULL DEFAULT 0,
    "totalBudget" DOUBLE PRECISION NOT NULL,
    "budgetPer" TEXT NOT NULL,
    "includeFlights" BOOLEAN NOT NULL DEFAULT true,
    "travelLevel" TEXT NOT NULL,
    "shoppingBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "emergencyBuffer" BOOLEAN NOT NULL DEFAULT true,
    "travelStyles" TEXT[],
    "paceLevel" INTEGER NOT NULL,
    "priorities" TEXT[],
    "stayType" TEXT NOT NULL,
    "hotelStars" INTEGER NOT NULL,
    "roomCount" INTEGER NOT NULL,
    "bedType" TEXT NOT NULL,
    "breakfastIncluded" BOOLEAN NOT NULL DEFAULT false,
    "amenities" TEXT[],
    "locationPreference" TEXT NOT NULL,
    "directFlightsOnly" BOOLEAN NOT NULL DEFAULT false,
    "preferredAirlines" TEXT,
    "cabinClass" TEXT NOT NULL,
    "flightTimePreference" TEXT NOT NULL,
    "maxLayoverHours" INTEGER NOT NULL,
    "transportType" TEXT NOT NULL,
    "maxTravelTimeBetweenPlaces" INTEGER NOT NULL,
    "mustDoList" TEXT,
    "interests" TEXT[],
    "avoidList" TEXT,
    "activityIntensity" TEXT NOT NULL,
    "mobilityNeeds" TEXT,
    "wakeUpTime" TEXT,
    "dailyActiveHours" INTEGER,
    "needsRestTime" BOOLEAN NOT NULL DEFAULT false,
    "walkingTolerance" INTEGER,
    "foodPreferences" TEXT[],
    "specialOccasion" TEXT,
    "hardConstraints" TEXT,
    "rawInput" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlanRecommendation" (
    "id" TEXT NOT NULL,
    "planInputId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "hotels" JSONB NOT NULL,
    "flights" JSONB NOT NULL,
    "activities" JSONB NOT NULL,
    "fitBullets" TEXT[],
    "rawAi" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanRecommendation_planInputId_createdAt_idx"
    ON "PlanRecommendation"("planInputId", "createdAt");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PlanRecommendation_planInputId_fkey'
  ) THEN
    ALTER TABLE "PlanRecommendation"
      ADD CONSTRAINT "PlanRecommendation_planInputId_fkey"
      FOREIGN KEY ("planInputId") REFERENCES "PlanInput"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
