import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const TARGET_BASE_URL = "https://genefortravelers.com";
const TARGET_COOKIE = "admin_auth=1";

const fallbackDestinations = [
  {
    title: "Santorini",
    slug: "santorini",
    imageUrl: "/bg/home-hero-bottom-optimized.jpg",
    iconUrl: null,
    affiliateLink: null,
    description: "Iconic sunsets, white architecture, and endless blue calm.",
    status: "published",
  },
  {
    title: "Milford Sound",
    slug: "milford-sound",
    imageUrl: "/images/patagonia.jpg",
    iconUrl: null,
    affiliateLink: null,
    description: "Breathtaking fjords and dramatic natural beauty.",
    status: "published",
  },
  {
    title: "Phuket",
    slug: "phuket",
    imageUrl: "/images/middle-bg.jpg",
    iconUrl: null,
    affiliateLink: null,
    description: "Tropical beaches and vibrant culture await you.",
    status: "published",
  },
  {
    title: "Zermatt",
    slug: "zermatt",
    imageUrl: "/images/paris.jpg",
    iconUrl: null,
    affiliateLink: null,
    description: "Where the Alps touch the sky and adventure begins.",
    status: "published",
  },
];

const fallbackOffers = [
  {
    title: "Maldives Escape",
    slug: "maldives-escape",
    imageUrl: "/images/customize-band.jpg",
    iconUrl: null,
    affiliateLink: null,
    location: "Maldives",
    country: "Maldives",
    duration: "5 Days / 4 Nights",
    startingPrice: "$899",
    description: "A polished island escape built for smart travelers.",
    discountBadge: "SAVE 20%",
    expiresAt: null,
    featured: true,
    showOnHome: true,
    status: "published",
  },
  {
    title: "Dubai Luxury Getaway",
    slug: "dubai-luxury-getaway",
    imageUrl: "/images/dubai.jpg",
    iconUrl: null,
    affiliateLink: null,
    location: "Dubai",
    country: "UAE",
    duration: "4 Days / 3 Nights",
    startingPrice: "$699",
    description: "A city break with cinematic polish and premium pace.",
    discountBadge: "SAVE 15%",
    expiresAt: null,
    featured: false,
    showOnHome: true,
    status: "published",
  },
  {
    title: "Bali Paradise",
    slug: "bali-paradise",
    imageUrl: "/images/patagonia.jpg",
    iconUrl: null,
    affiliateLink: null,
    location: "Bali",
    country: "Indonesia",
    duration: "6 Days / 5 Nights",
    startingPrice: "$749",
    description: "A tropical offer with a softer rhythm and strong visuals.",
    discountBadge: "SAVE 25%",
    expiresAt: null,
    featured: false,
    showOnHome: true,
    status: "published",
  },
];

const fallbackEvents = [
  {
    title: "Yi Peng Lantern Festival",
    slug: "yi-peng-lantern-festival",
    imageUrl: "/images/middle-bg.jpg",
    iconUrl: null,
    affiliateLink: null,
    category: "Festival",
    location: "Chiang Mai",
    country: "Thailand",
    dateRange: "Nov 15 - Nov 16, 2024",
    description: "A cinematic cultural event with a memorable nighttime atmosphere.",
    showOnHome: true,
    status: "published",
  },
  {
    title: "Tomorrowland Festival",
    slug: "tomorrowland-festival",
    imageUrl: "/images/barcelona.jpg",
    iconUrl: null,
    affiliateLink: null,
    category: "Music",
    location: "Boom",
    country: "Belgium",
    dateRange: "Jul 19 - Jul 21, 2024",
    description: "A flagship music event for travel-led festival planning.",
    showOnHome: true,
    status: "published",
  },
  {
    title: "Rio Carnival",
    slug: "rio-carnival",
    imageUrl: "/images/rome.jpg",
    iconUrl: null,
    affiliateLink: null,
    category: "Culture",
    location: "Rio de Janeiro",
    country: "Brazil",
    dateRange: "Feb 28 - Mar 08, 2025",
    description: "A high-energy cultural moment with strong visual storytelling.",
    showOnHome: true,
    status: "published",
  },
  {
    title: "America's Cup Regatta",
    slug: "americas-cup-regatta",
    imageUrl: "/images/barcelona.jpg",
    iconUrl: null,
    affiliateLink: null,
    category: "Sports",
    location: "Barcelona",
    country: "Spain",
    dateRange: "Aug 22 - Oct 27, 2024",
    description: "A premium sports event with a coastal luxury mood.",
    showOnHome: true,
    status: "published",
  },
];

function parseEnvFile(raw) {
  const map = new Map();
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;
    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    if (!map.has(key)) {
      map.set(key, value);
    }
  }
  return map;
}

async function loadSourceClient() {
  const envRaw = await readFile(SOURCE_ENV_PATH, "utf8");
  const env = parseEnvFile(envRaw);
  const url = env.get("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Missing source Supabase URL or service role key in .env");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function getJson(url, init = {}) {
  const response = await fetch(url, init);
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`GET ${url} failed with ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: TARGET_COOKIE,
    },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok || body?.ok === false) {
    throw new Error(`POST ${url} failed with ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

function normalizeDestination(row) {
  return {
    title: row.title,
    slug: row.slug,
    imageUrl: row.imageUrl ?? null,
    iconUrl: row.iconUrl ?? null,
    affiliateLink: row.affiliateLink ?? null,
    description: row.description ?? null,
    status: row.status ?? "draft",
  };
}

function normalizeOffer(row) {
  return {
    title: row.title,
    slug: row.slug,
    imageUrl: row.imageUrl ?? null,
    iconUrl: row.iconUrl ?? null,
    affiliateLink: row.affiliateLink ?? null,
    location: row.location ?? null,
    country: row.country ?? null,
    duration: row.duration ?? null,
    startingPrice: row.startingPrice ?? null,
    description: row.description ?? null,
    discountBadge: row.discountBadge ?? null,
    expiresAt: row.expiresAt ?? null,
    featured: Boolean(row.featured),
    showOnHome: Boolean(row.showOnHome),
    status: row.status ?? "draft",
  };
}

function normalizeEvent(row) {
  return {
    title: row.title,
    slug: row.slug,
    imageUrl: row.imageUrl ?? null,
    iconUrl: row.iconUrl ?? null,
    affiliateLink: row.affiliateLink ?? null,
    category: row.category ?? null,
    location: row.location ?? null,
    country: row.country ?? null,
    dateRange: row.dateRange ?? null,
    description: row.description ?? null,
    showOnHome: Boolean(row.showOnHome),
    status: row.status ?? "draft",
  };
}

function normalizeReadyPlan(row) {
  return {
    title: row.title,
    slug: row.slug,
    subtitle: row.subtitle ?? null,
    country: row.country ?? null,
    city: row.city ?? null,
    destination: row.destination,
    style: row.style ?? null,
    daysCount: row.daysCount ?? 0,
    heroImage: row.heroImage ?? null,
    coverImage: row.coverImage ?? null,
    summary: row.summary ?? null,
    seoTitle: row.seoTitle ?? null,
    seoDescription: row.seoDescription ?? null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    season: row.season ?? null,
    showOnHome: Boolean(row.showOnHome),
    priceFrom: row.priceFrom ?? null,
    currency: row.currency ?? "USD",
    daysJson: Array.isArray(row.daysJson) ? row.daysJson : [],
    contentJson: row.contentJson ?? null,
    status: row.status ?? "DRAFT",
    links: Array.isArray(row.links)
      ? row.links.map((link, index) => ({
          kind: link.kind ?? "booking",
          label: link.label,
          deeplink: link.deeplink,
          imageUrl: link.imageUrl ?? null,
          sortOrder: Number.isFinite(link.sortOrder) ? link.sortOrder : index,
        }))
      : [],
  };
}

async function fetchSourceContent(supabase) {
  async function safeFetch(label, queryBuilder) {
    const result = await queryBuilder;
    if (result.error) {
      if (result.error.message.includes("schema cache")) {
        return [];
      }
      throw new Error(`Failed to fetch ${label} from source Supabase: ${result.error.message}`);
    }
    return result.data ?? [];
  }

  const [destinationsRows, offersRows, eventsRows, readyPlansRows] = await Promise.all([
    safeFetch("destinations", supabase.from("destinations").select("*")),
    safeFetch("offers", supabase.from("offers").select("*")),
    safeFetch("events", supabase.from("events").select("*")),
    safeFetch(
      "ready plans",
      supabase
        .from("ready_plans")
        .select(`
          *,
          links:ready_plan_links(*)
        `),
    ),
  ]);

  return {
    destinations:
      destinationsRows.length > 0 ? destinationsRows.map(normalizeDestination) : fallbackDestinations,
    offers: offersRows.length > 0 ? offersRows.map(normalizeOffer) : fallbackOffers,
    events: eventsRows.length > 0 ? eventsRows.map(normalizeEvent) : fallbackEvents,
    readyPlans: readyPlansRows.map(normalizeReadyPlan),
  };
}

async function fetchTargetSlugs() {
  const [destinations, offers, events, readyPlans] = await Promise.all([
    getJson(`${TARGET_BASE_URL}/api/admin/destinations`, {
      headers: { Cookie: TARGET_COOKIE },
    }),
    getJson(`${TARGET_BASE_URL}/api/admin/offers`, {
      headers: { Cookie: TARGET_COOKIE },
    }),
    getJson(`${TARGET_BASE_URL}/api/admin/events`, {
      headers: { Cookie: TARGET_COOKIE },
    }),
    getJson(`${TARGET_BASE_URL}/api/admin/ready-plans`, {
      headers: { Cookie: TARGET_COOKIE },
    }),
  ]);

  return {
    destinations: new Set((destinations.destinations ?? []).map((item) => item.slug)),
    offers: new Set((offers.offers ?? []).map((item) => item.slug)),
    events: new Set((events.events ?? []).map((item) => item.slug)),
    readyPlans: new Set((readyPlans.plans ?? []).map((item) => item.slug)),
  };
}

async function importCollection(label, rows, existingSlugs, endpoint) {
  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.slug || existingSlugs.has(row.slug)) {
      skipped += 1;
      continue;
    }

    await postJson(`${TARGET_BASE_URL}${endpoint}`, row);
    existingSlugs.add(row.slug);
    created += 1;
  }

  return { created, skipped };
}

async function main() {
  const source = await loadSourceClient();
  const sourceContent = await fetchSourceContent(source);
  const targetSlugs = await fetchTargetSlugs();

  const destinationResult = await importCollection(
    "destinations",
    sourceContent.destinations,
    targetSlugs.destinations,
    "/api/admin/destinations",
  );
  const offerResult = await importCollection(
    "offers",
    sourceContent.offers,
    targetSlugs.offers,
    "/api/admin/offers",
  );
  const eventResult = await importCollection(
    "events",
    sourceContent.events,
    targetSlugs.events,
    "/api/admin/events",
  );
  const readyPlanResult = await importCollection(
    "ready plans",
    sourceContent.readyPlans,
    targetSlugs.readyPlans,
    "/api/admin/ready-plans",
  );

  console.log(
    JSON.stringify(
      {
        sourceCounts: {
          destinations: sourceContent.destinations.length,
          offers: sourceContent.offers.length,
          events: sourceContent.events.length,
          readyPlans: sourceContent.readyPlans.length,
        },
        imported: {
          destinations: destinationResult,
          offers: offerResult,
          events: eventResult,
          readyPlans: readyPlanResult,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
