import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";

const SOURCE_ENV_PATH = new URL("../.env", import.meta.url);
const SLUG = "singapore-skyline-glow-sentosa-shores-southern-islands";

const commons = (fileName, width = 1280) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=${width}`;

const images = {
  hero: commons("Gardens by the Bay Marina Bay Sands.jpg", 1440),
  marinaBay:
    commons("Marina Bay Sands and illuminated polyhedral building Louis Vuitton over the water at blue hour with pink clouds in Singapore.jpg", 1280),
  marinaHotel:
    commons("Puente Helix, museo ArtScience y hotel Marina Bay Sands, Marina Bay, Singapur, 2023-08-17, DD 67-69 HDR.jpg", 1280),
  gardens: commons("Gardens by the Bay, Singapore (54150067279).jpg", 1280),
  skypark:
    commons("Floating Platform and illuminated East Coast Parkway seen from the sky observation deck of Marina Bay Sands Singapore.jpg", 1280),
  chinatown: commons("Buddha tooth relic temple 2022.jpg", 1280),
  littleIndia: commons("Templo Sri Veeramakaliamman, Singapur, 2023-08-17, DD 01.jpg", 1280),
  nightSafari: commons("Singapore Night Safari (7448742056).jpg", 1280),
  sentosaBeach: commons("Palawan Beach Sentosa Singapore (36712573736).jpg", 1280),
  capella: commons("Capella Singapore aerial view.jpg", 1280),
  cableCar: commons("Sentosa Singapore Cable cars.jpg", 1280),
  universal: commons("Universal Studios Singapore globe, 20240206 1324 6457.jpg", 1000),
  lazarus: commons("Lazarus Island Beach.jpg", 1280),
  stJohns: commons("St. John's Island, Singapore, 2023 7.jpg", 1280),
  kusu: commons("Kusu Island, North beach, Singapore SF0001.jpg", 1280),
  changi: commons("Rain Vortex Night Jewel Changi Feb23 R16 06856.jpg", 1280),
  food: commons("Chicken rice at Maxwell Food Centre, Singapore - 20140622.jpg", 1280),
  wings: commons("Wings of Time Fireworks Symphony.jpg", 1280),
};

const dayImages = new Map([
  [1, images.marinaBay],
  [2, images.gardens],
  [3, images.nightSafari],
  [4, images.sentosaBeach],
  [5, images.universal],
  [6, images.lazarus],
  [7, images.changi],
]);

const suggestionImages = new Map([
  ["d1-s1", images.marinaBay],
  ["d1-s2", images.gardens],
  ["d2-s1", images.gardens],
  ["d2-s2", images.marinaBay],
  ["d3-s1", images.food],
  ["d3-s2", images.nightSafari],
  ["d4-s1", images.capella],
  ["d4-s2", images.sentosaBeach],
  ["d5-s1", images.universal],
  ["d5-s2", images.sentosaBeach],
  ["d6-s1", images.wings],
  ["d6-s2", images.lazarus],
  ["d7-s1", images.capella],
  ["d7-s2", images.changi],
]);

function imageForItem(item) {
  const id = String(item.id || "").toLowerCase();
  const title = String(item.title || "").toLowerCase();
  const badge = String(item.badge || item.categoryLabel || "").toLowerCase();

  if (id.includes("arrival") || id.includes("airport") || title.includes("changi") || title.includes("airport")) return images.changi;
  if (id.includes("hotelmarina") || title.includes("marina bay sands") || title.includes("marina bay hotel")) return images.marinaHotel;
  if (title.includes("marina bay") || title.includes("waterfront") || title.includes("skyline")) return images.marinaBay;
  if (title.includes("gardens by the bay") || title.includes("cloud forest") || title.includes("flower dome")) return images.gardens;
  if (title.includes("skypark") || title.includes("observation deck")) return images.skypark;
  if (title.includes("chinatown") || title.includes("buddha tooth")) return images.chinatown;
  if (title.includes("little india") || title.includes("veeramakaliamman")) return images.littleIndia;
  if (title.includes("night safari") || title.includes("mandai")) return images.nightSafari;
  if (title.includes("capella")) return images.capella;
  if (title.includes("palawan") || title.includes("siloso") || title.includes("sentosa coast") || title.includes("sentosa lunch") || title.includes("sentosa dinner")) return images.sentosaBeach;
  if (title.includes("wings of time")) return images.wings;
  if (title.includes("cable car") || title.includes("skypass")) return images.cableCar;
  if (title.includes("universal studios") || title.includes("express upgrade")) return images.universal;
  if (title.includes("st. john") || title.includes("st john")) return images.stJohns;
  if (title.includes("lazarus") || title.includes("southern islands ferry") || title.includes("return ferry")) return images.lazarus;
  if (title.includes("kusu")) return images.kusu;
  if (title.includes("lunch") || title.includes("dinner") || title.includes("breakfast") || badge.includes("food")) return images.food;
  if (title.includes("rest") || title.includes("pool") || title.includes("resort") || title.includes("checkout")) return images.capella;
  return images.hero;
}

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
      ((value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    if (!map.has(key)) map.set(key, value);
  }
  return map;
}

async function loadAdminClient() {
  const envRaw = await readFile(SOURCE_ENV_PATH, "utf8");
  const env = parseEnvFile(envRaw);
  const url = env.get("NEXT_PUBLIC_SUPABASE_URL") || env.get("SUPABASE_URL");
  const serviceRoleKey = env.get("SUPABASE_SERVICE_ROLE_KEY") || env.get("SUPABASE_SECRET_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase URL or service role key in .env");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function updateContentImages(content) {
  const next = structuredClone(content);
  next.hero = {
    ...(next.hero || {}),
    imageUrl: images.hero,
  };
  next.cta = {
    ...(next.cta || {}),
    imageUrl: images.marinaBay,
  };

  next.days = (next.days || []).map((day) => {
    const dayImage = dayImages.get(Number(day.dayNumber)) || images.hero;
    const timelineItems = (day.timelineItems || []).map((item) => ({
      ...item,
      imageUrl: imageForItem(item),
    }));
    const suggestions = (day.suggestions || []).map((suggestion) => ({
      ...suggestion,
      imageUrl: suggestionImages.get(suggestion.id) || imageForItem(suggestion),
    }));

    return {
      ...day,
      previewImage: dayImage,
      heroImage: dayImage,
      story: {
        ...(day.story || {}),
        imageUrl: dayImage,
      },
      timelineItems,
      suggestions,
    };
  });

  return next;
}

function buildDaysJson(content) {
  return (content.days || []).map((entry) => ({
    day: entry.dayNumber,
    title: entry.title,
    theme: entry.quote || entry.description || "",
    imageUrl: entry.heroImage || entry.previewImage || "",
    items: (entry.timelineItems || []).map((timelineItem) => ({
      time: timelineItem.time || "",
      title: timelineItem.title,
      note: timelineItem.description,
      type: timelineItem.type === "transportation" ? "transport" : timelineItem.type,
      imageUrl: timelineItem.imageUrl || "",
      deeplink: timelineItem.deeplink || "",
      buttonLabel: "Book Now",
    })),
  }));
}

async function main() {
  const supabase = await loadAdminClient();

  const existing = await supabase
    .from("ready_plans")
    .select("id, slug, status, title, contentJson")
    .eq("slug", SLUG)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (!existing.data?.id) throw new Error(`Ready plan slug "${SLUG}" was not found.`);
  if (!existing.data.contentJson) throw new Error(`Ready plan "${SLUG}" has no contentJson to update.`);

  const planId = existing.data.id;
  const contentJson = updateContentImages(existing.data.contentJson);
  const daysJson = buildDaysJson(contentJson);
  const updatedAt = new Date().toISOString();

  const planUpdate = await supabase
    .from("ready_plans")
    .update({
      heroImage: images.hero,
      coverImage: images.hero,
      image_url: images.hero,
      contentJson,
      daysJson,
      updatedAt,
    })
    .eq("id", planId);
  if (planUpdate.error) throw planUpdate.error;

  const days = await supabase
    .from("ready_plan_days")
    .select("id, dayNumber, items")
    .eq("readyPlanId", planId)
    .order("dayNumber", { ascending: true });
  if (days.error) throw days.error;

  let dayRowsUpdated = 0;
  let itemJsonRowsUpdated = 0;
  let itemRecordsUpdated = 0;

  for (const dayRecord of days.data || []) {
    const contentDay = contentJson.days.find((entry) => Number(entry.dayNumber) === Number(dayRecord.dayNumber));
    if (!contentDay) continue;

    const items = (dayRecord.items || []).map((entry) => ({
      ...entry,
      imageUrl:
        contentDay.timelineItems.find((contentItem) => contentItem.title === entry.title)?.imageUrl ||
        imageForItem(entry),
    }));

    const dayUpdate = await supabase
      .from("ready_plan_days")
      .update({
        mainImageUrl: contentDay.heroImage || contentDay.previewImage || null,
        items,
      })
      .eq("id", dayRecord.id);
    if (dayUpdate.error) throw dayUpdate.error;
    dayRowsUpdated += 1;
    itemJsonRowsUpdated += items.length;

    for (const itemEntry of contentDay.timelineItems || []) {
      const itemUpdate = await supabase
        .from("ready_plan_items")
        .update({ imageUrl: itemEntry.imageUrl || null })
        .eq("readyPlanDayId", dayRecord.id)
        .eq("title", itemEntry.title);
      if (itemUpdate.error) throw itemUpdate.error;
      itemRecordsUpdated += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        slug: SLUG,
        planId,
        status: existing.data.status,
        dayRowsUpdated,
        itemJsonRowsUpdated,
        itemRecordsUpdated,
        note: "Updated Singapore draft image URLs only. Text, status, affiliate links and other plans were not changed.",
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("UPDATE_SINGAPORE_READY_PLAN_IMAGES_FAILED");
  console.error(error);
  process.exit(1);
});
