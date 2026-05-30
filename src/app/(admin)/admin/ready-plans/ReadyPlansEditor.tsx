"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

type PlaceType = "hotel" | "activity" | "transportation" | "airline" | "traveling-place" | "none";

type ReadyPlanDayItemRecord = {
  time?: string;
  title?: string;
  note?: string;
  type?: string;
  imageUrl?: string;
  deeplink?: string;
};

type ReadyPlanDayRecord = {
  day?: number;
  title?: string;
  theme?: string;
  imageUrl?: string;
  items?: ReadyPlanDayItemRecord[];
};

type ReadyPlanLinkRecord = {
  id?: string;
  kind: string;
  label: string;
  deeplink: string;
  imageUrl?: string | null;
  sortOrder?: number;
};

export type ReadyPlanRecord = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  destination: string;
  daysCount: number;
  heroImage?: string | null;
  coverImage?: string | null;
  priceFrom?: number | null;
  currency: string;
  status: "DRAFT" | "PUBLISHED";
  daysJson: unknown;
  links: ReadyPlanLinkRecord[];
  updatedAt: string | Date;
};

type PlanItemDraft = {
  type: PlaceType;
  text: string;
  imageUrl: string;
  timeFrom: string;
  timeTo: string;
  affiliateUrl: string;
};

type PlanDayDraft = {
  day: number;
  title: string;
  theme: string;
  imageUrl: string;
  items: PlanItemDraft[];
};

type PlanDraft = {
  id?: string;
  slug: string;
  title: string;
  subtitle: string;
  destination: string;
  daysCount: number;
  heroImage: string;
  coverImage: string;
  priceFrom: string;
  currency: string;
  days: PlanDayDraft[];
};

function createEmptyItem(type: PlaceType = "none"): PlanItemDraft {
  return { type, text: "", imageUrl: "", timeFrom: "", timeTo: "", affiliateUrl: "" };
}

function createEmptyDay(day: number): PlanDayDraft {
  return { day, title: `Day ${day}`, theme: "", imageUrl: "", items: [createEmptyItem("hotel")] };
}

function createEmptyDraft(): PlanDraft {
  return {
    slug: "",
    title: "",
    subtitle: "",
    destination: "",
    daysCount: 1,
    heroImage: "",
    coverImage: "",
    priceFrom: "",
    currency: "USD",
    days: [createEmptyDay(1)],
  };
}

function splitTimeRange(value?: string) {
  const raw = String(value || "").trim();
  if (!raw) return { timeFrom: "", timeTo: "" };
  const dashMatch = raw.split("-").map((part) => part.trim());
  if (dashMatch.length >= 2) return { timeFrom: dashMatch[0], timeTo: dashMatch.slice(1).join(" - ") };
  return { timeFrom: raw, timeTo: "" };
}

function mapType(value?: string): PlaceType {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "hotel") return "hotel";
  if (normalized === "activity") return "activity";
  if (normalized === "transport" || normalized === "transportation") return "transportation";
  if (normalized === "flight" || normalized === "airline") return "airline";
  if (normalized === "traveling-place" || normalized === "traveling place") return "traveling-place";
  return "none";
}

function parseDays(value: unknown, fallbackCount: number): PlanDayDraft[] {
  if (!Array.isArray(value) || value.length === 0) {
    return Array.from({ length: Math.max(fallbackCount, 1) }, (_, index) => createEmptyDay(index + 1));
  }

  return value.map((entry, index) => {
    const day = entry as Record<string, unknown>;
    const items = Array.isArray(day.items)
      ? day.items.map((item) => {
          const rawItem = item as Record<string, unknown>;
          const range = splitTimeRange(String(rawItem.time ?? ""));
          return {
            type: mapType(String(rawItem.type ?? "none")),
            text: String(rawItem.title ?? rawItem.note ?? ""),
            imageUrl: String(rawItem.imageUrl ?? ""),
            timeFrom: range.timeFrom,
            timeTo: range.timeTo,
            affiliateUrl: String(rawItem.deeplink ?? ""),
          };
        })
      : [];

    return {
      day: Number(day.day ?? index + 1),
      title: String(day.title ?? `Day ${index + 1}`),
      theme: String(day.theme ?? ""),
      imageUrl: String(day.imageUrl ?? ""),
      items: items.length > 0 ? items : [createEmptyItem("none")],
    };
  });
}

function normalizePlan(plan?: ReadyPlanRecord): PlanDraft {
  if (!plan) return createEmptyDraft();

  return {
    id: plan.id,
    slug: plan.slug,
    title: plan.title,
    subtitle: plan.subtitle ?? "",
    destination: plan.destination,
    daysCount: plan.daysCount,
    heroImage: plan.heroImage ?? "",
    coverImage: plan.coverImage ?? "",
    priceFrom: plan.priceFrom ? String(plan.priceFrom) : "",
    currency: plan.currency,
    days: parseDays(plan.daysJson, plan.daysCount),
  };
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

function typeToApiValue(type: PlaceType) {
  if (type === "transportation") return "transport";
  if (type === "airline") return "flight";
  if (type === "traveling-place") return "activity";
  return type;
}

function typeLabel(type: PlaceType) {
  if (type === "traveling-place") return "Traveling Place";
  if (type === "airline") return "Airline";
  if (type === "transportation") return "Transportation";
  return type === "none" ? "None" : type.charAt(0).toUpperCase() + type.slice(1);
}

function buildPayload(draft: PlanDraft, status: "DRAFT" | "PUBLISHED") {
  const normalizedDays = draft.days.map((day, index) => ({
    day: index + 1,
    title: day.title.trim() || `Day ${index + 1}`,
    theme: day.theme.trim(),
    imageUrl: day.imageUrl.trim(),
    items: day.items
      .filter((item) => item.text.trim() || item.timeFrom.trim() || item.timeTo.trim())
      .map((item) => ({
        time:
          item.timeFrom.trim() && item.timeTo.trim()
            ? `${item.timeFrom.trim()} - ${item.timeTo.trim()}`
            : item.timeFrom.trim() || item.timeTo.trim(),
        title: item.text.trim(),
        note: item.type === "none" ? item.text.trim() : `${typeLabel(item.type)}${item.affiliateUrl.trim() ? " · Click to book" : ""}`,
        type: typeToApiValue(item.type),
        imageUrl: item.type === "none" ? "" : item.imageUrl.trim(),
        deeplink: item.type === "none" ? "" : item.affiliateUrl.trim(),
      })),
  }));

  const quickLinks = normalizedDays
    .flatMap((day) => day.items)
    .filter((item) => item.deeplink)
    .map((item, index) => ({
      kind: item.type,
      label: item.title,
      deeplink: item.deeplink,
      imageUrl: item.imageUrl || null,
      sortOrder: index,
    }));

  return {
    slug: slugify(draft.slug || draft.title),
    title: draft.title.trim(),
    subtitle: draft.subtitle.trim() || null,
    destination: draft.destination.trim(),
    daysCount: Math.max(draft.days.length, draft.daysCount || 0),
    heroImage: draft.heroImage.trim() || null,
    coverImage: draft.coverImage.trim() || null,
    priceFrom: draft.priceFrom.trim() ? Number(draft.priceFrom) : null,
    currency: draft.currency.trim() || "USD",
    status,
    daysJson: normalizedDays,
    links: quickLinks,
  };
}

async function submitPlan(draft: PlanDraft, status: "DRAFT" | "PUBLISHED") {
  const payload = buildPayload(draft, status);
  const method = draft.id ? "PATCH" : "POST";
  const url = draft.id ? `/api/admin/ready-plans/${draft.id}` : "/api/admin/ready-plans";
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.code || "SAVE_FAILED");
  }
  return response.json();
}

async function deletePlan(id: string) {
  const response = await fetch(`/api/admin/ready-plans/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.code || "DELETE_FAILED");
  }

  return response.json();
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-white/44">{label}</div>
      {children}
    </label>
  );
}

function Panel({ title, caption, children }: { title: string; caption?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5">
      <div className="text-xs uppercase tracking-[0.28em] text-[#ffb066]">{title}</div>
      {caption ? <p className="mt-3 text-sm leading-7 text-white/58">{caption}</p> : null}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export default function ReadyPlansEditor({ plans }: { plans: ReadyPlanRecord[] }) {
  const [drafts, setDrafts] = useState<PlanDraft[]>(() =>
    plans.length > 0 ? plans.map((plan) => normalizePlan(plan)) : [createEmptyDraft()],
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [expandedDayKey, setExpandedDayKey] = useState("");
  const [selectedDraftIndex, setSelectedDraftIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const orderedDrafts = useMemo(() => drafts, [drafts]);

  useEffect(() => {
    if (!expandedDayKey && orderedDrafts.length > 0) {
      setExpandedDayKey(`${orderedDrafts[0].id ?? "new-0"}-day-0`);
    }
  }, [expandedDayKey, orderedDrafts]);

  function updateDraft(index: number, updater: (current: PlanDraft) => PlanDraft) {
    setDrafts((current) => current.map((draft, draftIndex) => (draftIndex === index ? updater(draft) : draft)));
  }

  function saveDraft(index: number, status: "DRAFT" | "PUBLISHED") {
    startTransition(async () => {
      try {
        await submitPlan(drafts[index], status);
        setStatusMessage(status === "PUBLISHED" ? "Ready plan published successfully." : "Ready plan saved as draft.");
        window.location.reload();
      } catch (error: any) {
        setStatusMessage(error?.message || "Could not save ready plan.");
      }
    });
  }

  function addNewPlan() {
    setDrafts((current) => {
      const next = [...current, createEmptyDraft()];
      setSelectedDraftIndex(next.length - 1);
      return next;
    });
  }

  function removeDraft(index: number) {
    const draft = drafts[index];
    if (draft.id && !window.confirm("Permanently delete this ready plan from the site, admin, dashboard, and database?")) {
      return;
    }

    startTransition(async () => {
      try {
        if (draft.id) {
          await deletePlan(draft.id);
          setStatusMessage("Ready plan permanently deleted.");
          window.location.reload();
          return;
        }

        setDrafts((current) => current.filter((_, draftIndex) => draftIndex !== index));
        setSelectedDraftIndex((current) => Math.max(0, Math.min(current, drafts.length - 2)));
        setStatusMessage("Unsaved ready plan removed.");
      } catch (error: any) {
        setStatusMessage(error?.message || "Could not remove ready plan.");
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-[#ffb066]">Ready Plan Builder</div>
            <h2 className="mt-3 text-3xl font-semibold text-white">Build day by day, then save as draft or publish.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/62">
              Add a day, open it, choose the place type, then attach time, image, and affiliate link only where needed.
            </p>
          </div>
          <button
            type="button"
            onClick={addNewPlan}
            className="rounded-2xl bg-[#ff7a00] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#ff9330]"
          >
            Add New Plan
          </button>
        </div>
        {statusMessage ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/75">
            {statusMessage}
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="rounded-[30px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
          <div className="text-xs uppercase tracking-[0.28em] text-[#ffb066]">Plans List</div>
          <div className="mt-4 space-y-3">
            {orderedDrafts.map((draft, index) => {
              const selected = selectedDraftIndex === index;
              return (
                <div
                  key={draft.id ?? `list-${index}`}
                  className={`rounded-[24px] border p-4 transition ${
                    selected
                      ? "border-[#ffb066]/40 bg-[linear-gradient(135deg,rgba(255,122,0,0.18),rgba(255,255,255,0.05))]"
                      : "border-white/10 bg-black/20"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedDraftIndex(index)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-white">
                        {draft.title || `Untitled Plan ${index + 1}`}
                      </div>
                      <div
                        className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${
                          draft.id
                            ? "border border-white/10 bg-white/[0.06] text-white/72"
                            : "border border-[#ffb066]/30 bg-[#ff7a00]/10 text-[#ffbf82]"
                        }`}
                      >
                        {draft.id ? "Saved" : "New"}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-white/58">{draft.destination || "No destination yet"}</div>
                    <div className="mt-3 text-[11px] uppercase tracking-[0.22em] text-white/42">
                      {draft.days.length} days
                    </div>
                  </button>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDraftIndex(index)}
                      className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-white/72 transition hover:bg-white/[0.1]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => saveDraft(index, "PUBLISHED")}
                      className="rounded-full border border-[#ffb066]/30 bg-[#ff7a00]/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-[#ffbf82] transition hover:bg-[#ff7a00]/20 disabled:opacity-60"
                    >
                      Publish
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => saveDraft(index, "DRAFT")}
                      className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-white/72 transition hover:bg-white/[0.1] disabled:opacity-60"
                    >
                      Draft
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => removeDraft(index)}
                      className="rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-red-100 transition hover:bg-red-500/20 disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <div className="space-y-6">
        {orderedDrafts.map((draft, index) =>
          index === selectedDraftIndex ? (
          <section
            key={draft.id ?? `new-${index}`}
            className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.22))] shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
          >
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-[#ffbf82]">
                    {draft.id ? "Edit Ready Plan" : "New Ready Plan"}
                  </div>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{draft.title || "Untitled cinematic plan"}</h3>
                  <p className="mt-2 text-sm text-white/55">{draft.destination || "Choose destination and start arranging the days."}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {draft.id ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => removeDraft(index)}
                      className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/20 disabled:opacity-60"
                    >
                      Remove Plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => removeDraft(index)}
                      className="rounded-2xl border border-white/12 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.12] disabled:opacity-60"
                    >
                      Remove Draft
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => saveDraft(index, "DRAFT")}
                    className="rounded-2xl border border-white/12 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.12] disabled:opacity-60"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => saveDraft(index, "PUBLISHED")}
                    className="rounded-2xl bg-[#ff7a00] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#ff9330] disabled:opacity-60"
                  >
                    Publish
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6 xl:grid-cols-[0.88fr_1.12fr]">
              <div className="space-y-6">
                <Panel title="Plan Identity" caption="This controls the hero and summary shown to customers.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Title"><input value={draft.title} onChange={(e) => updateDraft(index, (c) => ({ ...c, title: e.target.value }))} className="input" placeholder="Dubai Luxury Weekend" /></Field>
                    <Field label="Slug"><input value={draft.slug} onChange={(e) => updateDraft(index, (c) => ({ ...c, slug: e.target.value }))} className="input" placeholder="dubai-luxury-weekend" /></Field>
                    <Field label="Destination"><input value={draft.destination} onChange={(e) => updateDraft(index, (c) => ({ ...c, destination: e.target.value }))} className="input" placeholder="Dubai, UAE" /></Field>
                    <Field label="Starting Price"><input value={draft.priceFrom} onChange={(e) => updateDraft(index, (c) => ({ ...c, priceFrom: e.target.value }))} className="input" placeholder="1200" /></Field>
                    <Field label="Currency"><input value={draft.currency} onChange={(e) => updateDraft(index, (c) => ({ ...c, currency: e.target.value }))} className="input" placeholder="USD" /></Field>
                    <Field label="Total Days"><input type="number" value={draft.daysCount} onChange={(e) => {
                      const nextCount = Math.max(Number(e.target.value) || 1, 1);
                      updateDraft(index, (current) => {
                        const nextDays = [...current.days];
                        while (nextDays.length < nextCount) nextDays.push(createEmptyDay(nextDays.length + 1));
                        return { ...current, daysCount: nextCount, days: nextDays.slice(0, nextCount).map((day, dayIndex) => ({ ...day, day: dayIndex + 1, title: day.title || `Day ${dayIndex + 1}` })) };
                      });
                    }} className="input" /></Field>
                  </div>
                  <Field label="Subtitle"><textarea value={draft.subtitle} onChange={(e) => updateDraft(index, (c) => ({ ...c, subtitle: e.target.value }))} className="input min-h-[100px]" placeholder="Luxury skyline, desert sunset, marina nights." /></Field>
                </Panel>

                <Panel title="Visual Assets" caption="These images shape the cinematic customer page.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Hero Image"><input value={draft.heroImage} onChange={(e) => updateDraft(index, (c) => ({ ...c, heroImage: e.target.value }))} className="input" placeholder="https://..." /></Field>
                    <Field label="Cover Image"><input value={draft.coverImage} onChange={(e) => updateDraft(index, (c) => ({ ...c, coverImage: e.target.value }))} className="input" placeholder="https://..." /></Field>
                  </div>
                </Panel>
              </div>

              <div className="space-y-6">
                <Panel title="Day Builder" caption="Open a day, then add each stop in the order customers will see it.">
                  <div className="flex flex-wrap gap-3">
                    {draft.days.map((day, dayIndex) => {
                      const dayKey = `${draft.id ?? `new-${index}`}-day-${dayIndex}`;
                      const expanded = expandedDayKey === dayKey;
                      return (
                        <button
                          key={dayKey}
                          type="button"
                          onClick={() => setExpandedDayKey(dayKey)}
                          className={`rounded-full border px-4 py-2 text-sm transition ${expanded ? "border-[#ffb066]/40 bg-[#ff7a00] text-black" : "border-white/10 bg-white/[0.05] text-white/78 hover:bg-white/[0.1]"}`}
                        >
                          Day {day.day}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft(index, (current) => {
                          const nextDay = current.days.length + 1;
                          const nextDays = [...current.days, createEmptyDay(nextDay)];
                          setExpandedDayKey(`${current.id ?? `new-${index}`}-day-${nextDay - 1}`);
                          return { ...current, daysCount: nextDays.length, days: nextDays };
                        })
                      }
                      className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/78 transition hover:bg-white/[0.1]"
                    >
                      Add Day
                    </button>
                  </div>
                  {draft.days.map((day, dayIndex) => {
                    const dayKey = `${draft.id ?? `new-${index}`}-day-${dayIndex}`;
                    if (expandedDayKey !== dayKey) return null;

                    return (
                      <div key={`${dayKey}-panel`} className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                        <div className="grid gap-4 md:grid-cols-3">
                          <Field label="Day Title"><input value={day.title} onChange={(e) => updateDraft(index, (c) => ({ ...c, days: c.days.map((entry, entryIndex) => entryIndex === dayIndex ? { ...entry, title: e.target.value } : entry) }))} className="input" placeholder="Arrival & skyline reset" /></Field>
                          <Field label="Theme"><input value={day.theme} onChange={(e) => updateDraft(index, (c) => ({ ...c, days: c.days.map((entry, entryIndex) => entryIndex === dayIndex ? { ...entry, theme: e.target.value } : entry) }))} className="input" placeholder="Golden-hour marina" /></Field>
                          <Field label="Day Image"><input value={day.imageUrl} onChange={(e) => updateDraft(index, (c) => ({ ...c, days: c.days.map((entry, entryIndex) => entryIndex === dayIndex ? { ...entry, imageUrl: e.target.value } : entry) }))} className="input" placeholder="https://..." /></Field>
                        </div>

                        <div className="mt-5 space-y-4">
                          {day.items.map((item, itemIndex) => {
                            const showRichFields = item.type !== "none";
                            return (
                              <div key={`${dayKey}-item-${itemIndex}`} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                  <Field label="Place">
                                    <select value={item.type} onChange={(e) => updateDraft(index, (c) => ({ ...c, days: c.days.map((entry, entryIndex) => entryIndex === dayIndex ? { ...entry, items: entry.items.map((entryItem, entryItemIndex) => entryItemIndex === itemIndex ? { ...entryItem, type: e.target.value as PlaceType, imageUrl: e.target.value === "none" ? "" : entryItem.imageUrl, affiliateUrl: e.target.value === "none" ? "" : entryItem.affiliateUrl } : entryItem) } : entry) }))} className="input">
                                      <option value="hotel">Hotel</option>
                                      <option value="activity">Activity</option>
                                      <option value="transportation">Transportation</option>
                                      <option value="airline">Airline</option>
                                      <option value="traveling-place">Traveling Place</option>
                                      <option value="none">None</option>
                                    </select>
                                  </Field>
                                  <Field label="Time From"><input value={item.timeFrom} onChange={(e) => updateDraft(index, (c) => ({ ...c, days: c.days.map((entry, entryIndex) => entryIndex === dayIndex ? { ...entry, items: entry.items.map((entryItem, entryItemIndex) => entryItemIndex === itemIndex ? { ...entryItem, timeFrom: e.target.value } : entryItem) } : entry) }))} className="input" placeholder="09:00" /></Field>
                                  <Field label="Time To"><input value={item.timeTo} onChange={(e) => updateDraft(index, (c) => ({ ...c, days: c.days.map((entry, entryIndex) => entryIndex === dayIndex ? { ...entry, items: entry.items.map((entryItem, entryItemIndex) => entryItemIndex === itemIndex ? { ...entryItem, timeTo: e.target.value } : entryItem) } : entry) }))} className="input" placeholder="11:00" /></Field>
                                  <Field label="Text"><textarea value={item.text} onChange={(e) => updateDraft(index, (c) => ({ ...c, days: c.days.map((entry, entryIndex) => entryIndex === dayIndex ? { ...entry, items: entry.items.map((entryItem, entryItemIndex) => entryItemIndex === itemIndex ? { ...entryItem, text: e.target.value } : entryItem) } : entry) }))} className="input min-h-[88px]" placeholder="Check in at Address Beach Resort" /></Field>
                                  {showRichFields ? <Field label="Image"><input value={item.imageUrl} onChange={(e) => updateDraft(index, (c) => ({ ...c, days: c.days.map((entry, entryIndex) => entryIndex === dayIndex ? { ...entry, items: entry.items.map((entryItem, entryItemIndex) => entryItemIndex === itemIndex ? { ...entryItem, imageUrl: e.target.value } : entryItem) } : entry) }))} className="input" placeholder="https://..." /></Field> : null}
                                  {showRichFields ? <Field label="Affiliate URL"><input value={item.affiliateUrl} onChange={(e) => updateDraft(index, (c) => ({ ...c, days: c.days.map((entry, entryIndex) => entryIndex === dayIndex ? { ...entry, items: entry.items.map((entryItem, entryItemIndex) => entryItemIndex === itemIndex ? { ...entryItem, affiliateUrl: e.target.value } : entryItem) } : entry) }))} className="input" placeholder="https://..." /></Field> : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => updateDraft(index, (c) => ({ ...c, days: c.days.map((entry, entryIndex) => entryIndex === dayIndex ? { ...entry, items: [...entry.items, createEmptyItem("none")] } : entry) }))}
                            className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/78 transition hover:bg-white/[0.1]"
                          >
                            Add Place
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </Panel>
              </div>
            </div>
          </section>
          ) : null,
        )}
        </div>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.3);
          padding: 0.85rem 1rem;
          color: white;
        }
        .input::placeholder {
          color: rgba(255, 255, 255, 0.32);
        }
      `}</style>
    </div>
  );
}
