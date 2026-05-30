export type Slot = "MORNING" | "MIDDAY" | "AFTERNOON" | "EVENING";
export type BlockKind = "HOTEL" | "ACTIVITY" | "TRANSPORT" | "FLIGHT";

export type PlanBlock = {
  slot: Slot;
  kind: BlockKind;
  title: string;
  providerItemId: string | null;
  startTime: string;
  endTime: string;
  notes?: string;
};

export type PlanDayContract = {
  dayIndex: number;
  date: string;
  blocks: PlanBlock[];
};

export type AnalysisFeature = {
  key: string;
  status: "good" | "warn" | "bad";
  text: string;
};

export type PlanContract = {
  picks: {
    hotelId: string | null;
    flightId: string | null;
    transportId: string | null;
    activityIds: string[];
  };
  timeline: PlanDayContract[];
  analysis: {
    features: AnalysisFeature[];
    budgetSummary: { status: "good" | "warn" | "bad"; text: string };
    timingSummary: { status: "good" | "warn" | "bad"; text: string };
  };
};