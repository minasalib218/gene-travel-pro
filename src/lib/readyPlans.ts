// src/lib/readyPlans.ts
export type BudgetBand = "LOW" | "MID" | "HIGH" | "LUX";

export type ReadyPlan = {
  id: string;
  title: string;
  subtitle: string;
  image: string; // public path OR full url
  price: string; // display only (ex: "$25" or "from 35 SAR")
  days: number;
  budgetBand: BudgetBand; // ✅ solves budgetBand error
  href: string; // link to details page
  tags: string[];
};

export const readyPlans: ReadyPlan[] = [
  {
    id: "rp_dubai_4d_balanced",
    title: "Dubai — 4 Days Balanced",
    subtitle: "City icons • Desert • Marina",
    image: "/bg/home-hero.png",
    price: "from $25",
    days: 4,
    budgetBand: "MID",
    href: "/ready-plans/rp_dubai_4d_balanced",
    tags: ["family", "city", "balanced"],
  },
  {
    id: "rp_istanbul_5d_food",
    title: "Istanbul — 5 Days Food & Culture",
    subtitle: "Bazaars • Bosphorus • Museums",
    image: "/bg/home-hero.png",
    price: "from $25",
    days: 5,
    budgetBand: "MID",
    href: "/ready-plans/rp_istanbul_5d_food",
    tags: ["culture", "food", "shopping"],
  },
  {
    id: "rp_maldives_6d_lux",
    title: "Maldives — 6 Days Luxury Escape",
    subtitle: "Resort • Sunset • Relax",
    image: "/bg/home-hero.png",
    price: "from $40",
    days: 6,
    budgetBand: "LUX",
    href: "/ready-plans/rp_maldives_6d_lux",
    tags: ["luxury", "honeymoon", "relaxed"],
  },
];