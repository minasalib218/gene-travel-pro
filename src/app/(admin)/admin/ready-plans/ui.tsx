"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

const ORANGE = "#ff7a00";

type ReadyPlanLink = {
  id?: string;
  kind: string;
  label: string;
  deeplink: string;
  imageUrl?: string | null;
  sortOrder?: number;
};

type ReadyPlan = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  priceFrom?: number | null;
  currency: string;
  days: number;
  budgetBand?: string | null;
  tags: string[];
  contentJson?: any | null;
  isPublished: boolean;
  links: ReadyPlanLink[];
};

type Draft = {
  id?: string;
  slug: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  priceFrom: string; // ✅ string in UI
  currency: string;
  days: string;
  budgetBand: string;
  tags: string; // comma separated
  isPublished: boolean;
  links: ReadyPlanLink[];
};

function emptyDraft(): Draft {
  return {
    slug: "",
    title: "",
    subtitle: "",
    imageUrl: "",
    priceFrom: "",
    currency: "USD",
    days: "3",
    budgetBand: "",
    tags: "",
    isPublished: false,
    links: [
      { kind: "HOTEL", label: "Book Hotel", deeplink: "", imageUrl: null, sortOrder: 0 },
      { kind: "TOUR", label: "Book Trip", deeplink: "", imageUrl: null, sortOrder: 1 },
    ],
  };
}

export default function ReadyPlansAdminClient({ initialPlans }: { initialPlans: ReadyPlan[] }) {
  const [plans, setPlans] = useState<ReadyPlan[]>(initialPlans ?? []);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());

  const hasId = Boolean(draft.id);

  const previewTags = useMemo(() => {
    return draft.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8);
  }, [draft.tags]);

  function openCreate() {
    setDraft(emptyDraft());
    setOpen(true);
  }

  function openEdit(p: ReadyPlan) {
    setDraft({
      id: p.id,
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle ?? "",
      imageUrl: p.imageUrl ?? "",
      priceFrom: p.priceFrom === null || p.priceFrom === undefined ? "" : String(p.priceFrom),
      currency: p.currency ?? "USD",
      days: String(p.days ?? 3),
      budgetBand: p.budgetBand ?? "",
      tags: (p.tags ?? []).join(", "),
      isPublished: Boolean(p.isPublished),
      links: Array.isArray(p.links) ? p.links.map((l, idx) => ({ ...l, sortOrder: l.sortOrder ?? idx })) : [],
    });
    setOpen(true);
  }

  async function reload() {
    const r = await fetch("/api/admin/ready-plans", { cache: "no-store" });
    const j = await r.json().catch(() => null);
    setPlans(j?.plans ?? []);
  }

  function setLink(i: number, patch: Partial<ReadyPlanLink>) {
    setDraft((d) => {
      const next = [...d.links];
      next[i] = { ...next[i], ...patch };
      return { ...d, links: next };
    });
  }

  function addLink() {
    setDraft((d) => ({
      ...d,
      links: [
        ...d.links,
        { kind: "CUSTOM", label: "Book now", deeplink: "", imageUrl: null, sortOrder: d.links.length },
      ],
    }));
  }

  function removeLink(i: number) {
    setDraft((d) => ({ ...d, links: d.links.filter((_, idx) => idx !== i) }));
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        id: draft.id,
        slug: draft.slug.trim(),
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim() ? draft.subtitle.trim() : null,
        imageUrl: draft.imageUrl.trim() ? draft.imageUrl.trim() : null,
        priceFrom: draft.priceFrom.trim() === "" ? null : Number(draft.priceFrom),
        currency: draft.currency,
        days: Number(draft.days || 3),
        budgetBand: draft.budgetBand.trim() ? draft.budgetBand.trim() : null,
        tags: draft.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        isPublished: Boolean(draft.isPublished),
        links: (draft.links ?? []).map((l, idx) => ({
          kind: String(l.kind || "CUSTOM"),
          label: String(l.label || "Book now"),
          deeplink: String(l.deeplink || ""),
          imageUrl: l.imageUrl ? String(l.imageUrl) : null,
          sortOrder: Number(l.sortOrder ?? idx),
        })),
      };

      if (!payload.slug || !payload.title) {
        alert("Slug + Title are required.");
        return;
      }

      const r = await fetch("/api/admin/ready-plans", {
        method: hasId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await r.json().catch(() => null);
      if (!j?.ok) {
        alert(`Save failed: ${j?.code || "UNKNOWN"}`);
        return;
      }

      setOpen(false);
      await reload();
    } finally {
      setSaving(false);
    }
  }

  async function del(id: string) {
    if (!confirm("Delete this Ready Plan?")) return;
    setDeletingId(id);
    try {
      const r = await fetch("/api/admin/ready-plans", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await r.json().catch(() => null);
      if (!j?.ok) {
        alert(`Delete failed: ${j?.code || "UNKNOWN"}`);
        return;
      }
      await reload();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Ready Plans</h2>
          <p className="text-white/70 text-sm mt-1">
            Create/edit cinematic ready plans + affiliate deeplinks behind buttons.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="rounded-2xl px-5 py-3 font-semibold text-black hover:opacity-90 transition"
          style={{ backgroundColor: ORANGE }}
        >
          + Add Ready Plan
        </button>
      </div>

      <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.id} className="rounded-3xl border border-white/10 bg-black/30 overflow-hidden">
            <div className="relative h-40 w-full">
              <Image
                src={p.imageUrl || "/bg/home-hero.png"}
                alt=""
                fill
                className="object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-white/70">/{p.slug}</div>
                  <span
                    className={`text-[11px] px-2 py-1 rounded-full border ${
                      p.isPublished ? "border-green-400/30 text-green-200" : "border-white/15 text-white/60"
                    }`}
                  >
                    {p.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="text-lg font-semibold mt-1">{p.title}</div>
                {p.subtitle && <div className="text-white/70 text-sm">{p.subtitle}</div>}
              </div>
            </div>

            <div className="p-4">
              <div className="flex flex-wrap gap-2 text-[11px] text-white/70">
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                  {p.days} days
                </span>
                {p.budgetBand && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                    Budget: {p.budgetBand}
                  </span>
                )}
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                  {p.priceFrom ? `${p.priceFrom} ${p.currency}` : `No price`}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(p.tags ?? []).slice(0, 6).map((t) => (
                  <span key={t} className="text-[11px] text-white/60 border border-white/10 rounded-full px-2 py-1">
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openEdit(p)}
                  className="flex-1 rounded-2xl px-4 py-2 bg-white/10 border border-white/10 hover:bg-white/15 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => del(p.id)}
                  disabled={deletingId === p.id}
                  className="rounded-2xl px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 transition text-white/80"
                >
                  {deletingId === p.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ))}

        {plans.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70">
            No ready plans yet. Click <span style={{ color: ORANGE }}>+ Add Ready Plan</span>.
          </div>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/75" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-2xl border-l border-white/10 bg-black/80 backdrop-blur-xl overflow-auto">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-white/60 text-sm">{hasId ? "Edit Ready Plan" : "Create Ready Plan"}</div>
                  <div className="text-2xl font-semibold mt-1">{draft.title || "Untitled"}</div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-2xl px-4 py-2 bg-white/10 border border-white/10 hover:bg-white/15 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={save}
                    disabled={saving}
                    className="rounded-2xl px-4 py-2 font-semibold text-black hover:opacity-90 transition"
                    style={{ backgroundColor: ORANGE }}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <Field label="Slug (unique)" value={draft.slug} onChange={(v) => setDraft((d) => ({ ...d, slug: v }))} />
                <Field label="Title" value={draft.title} onChange={(v) => setDraft((d) => ({ ...d, title: v }))} />
                <Field
                  label="Subtitle"
                  value={draft.subtitle}
                  onChange={(v) => setDraft((d) => ({ ...d, subtitle: v }))}
                />
                <Field
                  label="Image URL"
                  value={draft.imageUrl}
                  onChange={(v) => setDraft((d) => ({ ...d, imageUrl: v }))}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Price From (number)"
                    value={draft.priceFrom}
                    onChange={(v) => setDraft((d) => ({ ...d, priceFrom: v }))}
                  />
                  <Field
                    label="Currency (USD/SAR/EGP)"
                    value={draft.currency}
                    onChange={(v) => setDraft((d) => ({ ...d, currency: v }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Days" value={draft.days} onChange={(v) => setDraft((d) => ({ ...d, days: v }))} />
                  <Field
                    label="Budget Band"
                    value={draft.budgetBand}
                    onChange={(v) => setDraft((d) => ({ ...d, budgetBand: v }))}
                  />
                </div>

                <Field
                  label="Tags (comma separated)"
                  value={draft.tags}
                  onChange={(v) => setDraft((d) => ({ ...d, tags: v }))}
                />

                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div>
                    <div className="font-semibold">Publish on site</div>
                    <div className="text-white/60 text-sm">If ON, it can appear in public Ready Plans page.</div>
                  </div>
                  <button
                    onClick={() => setDraft((d) => ({ ...d, isPublished: !d.isPublished }))}
                    className="rounded-2xl px-4 py-2 border border-white/10 bg-white/10 hover:bg-white/15 transition"
                  >
                    {draft.isPublished ? "ON" : "OFF"}
                  </button>
                </div>

                {/* Tags preview */}
                <div className="flex flex-wrap gap-2">
                  {previewTags.map((t) => (
                    <span key={t} className="text-[11px] text-white/70 border border-white/10 rounded-full px-2 py-1">
                      {t}
                    </span>
                  ))}
                </div>

                {/* Links */}
                <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold">Affiliate Buttons</div>
                      <div className="text-white/60 text-sm">These are the “Book now” buttons (deeplinks).</div>
                    </div>
                    <button
                      onClick={addLink}
                      className="rounded-2xl px-4 py-2 bg-white/10 border border-white/10 hover:bg-white/15 transition"
                    >
                      + Add Link
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {draft.links.map((l, idx) => (
                      <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="grid grid-cols-2 gap-3">
                          <Field
                            label="Kind (HOTEL/TOUR/FLIGHT/CAR/CUSTOM)"
                            value={l.kind}
                            onChange={(v) => setLink(idx, { kind: v })}
                          />
                          <Field label="Label" value={l.label} onChange={(v) => setLink(idx, { label: v })} />
                        </div>
                        <div className="mt-3">
                          <Field
                            label="Deeplink (affiliate URL)"
                            value={l.deeplink}
                            onChange={(v) => setLink(idx, { deeplink: v })}
                          />
                        </div>
                        <div className="mt-3 grid grid-cols-[1fr,120px] gap-3 items-end">
                          <Field
                            label="Optional Image URL"
                            value={l.imageUrl ?? ""}
                            onChange={(v) => setLink(idx, { imageUrl: v || null })}
                          />
                          <button
                            onClick={() => removeLink(idx)}
                            className="rounded-2xl px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ContentJson لاحقاً */}
                <div className="text-xs text-white/50">
                  Next: we will add “Day-by-day itinerary editor” (contentJson) inside the same UI.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field(props: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="text-xs text-white/60 mb-2">{props.label}</div>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-white/25 text-white"
      />
    </label>
  );
}