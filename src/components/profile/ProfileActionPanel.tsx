"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  travelPreference?: any;
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#ff7a00]/60";
const buttonClass =
  "rounded-xl bg-[#ff7a00] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#ff8d25] disabled:cursor-not-allowed disabled:opacity-55";

export default function ProfileActionPanel({ travelPreference }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function submitJson(path: string, body: Record<string, unknown>, success: string, method = "POST") {
    setBusy(path);
    setMessage(null);
    try {
      const res = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.ok === false) {
        setMessage(data?.message || data?.code || "Could not save that yet.");
        return;
      }
      setMessage(success);
      router.refresh();
    } catch {
      setMessage("Connection failed. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function savePreferences(formData: FormData) {
    const travelStyles = String(formData.get("travelStyles") || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const preferredRegions = String(formData.get("preferredRegions") || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const min = Number(formData.get("preferredBudgetMin") || 0);
    const max = Number(formData.get("preferredBudgetMax") || 0);

    await submitJson(
      "/api/profile/preferences",
      {
        travelStyles,
        preferredRegions,
        preferredCurrency: String(formData.get("preferredCurrency") || "USD").trim() || "USD",
        preferredBudgetMin: Number.isFinite(min) && min > 0 ? min : null,
        preferredBudgetMax: Number.isFinite(max) && max > 0 ? max : null,
        hotelPreference: String(formData.get("hotelPreference") || "").trim() || null,
        preferredTransportation: String(formData.get("preferredTransportation") || "").trim() || null,
        activityIntensity: String(formData.get("activityIntensity") || "").trim() || null,
      },
      "Preferences saved.",
      "PUT",
    );
  }

  async function addReminder(formData: FormData) {
    const date = String(formData.get("reminderDate") || "");
    await submitJson(
      "/api/profile/reminders",
      {
        title: String(formData.get("title") || "").trim(),
        reminderType: formData.get("reminderType"),
        reminderDate: date ? new Date(date).toISOString() : "",
        tripName: String(formData.get("tripName") || "").trim() || null,
        notes: String(formData.get("notes") || "").trim() || null,
      },
      "Reminder added.",
    );
  }

  async function openTicket(formData: FormData) {
    await submitJson(
      "/api/profile/support",
      {
        subject: String(formData.get("subject") || "").trim(),
        message: String(formData.get("message") || "").trim(),
        priority: formData.get("priority") || "MEDIUM",
      },
      "Support ticket sent to the admin dashboard.",
    );
  }

  async function uploadDocument(formData: FormData) {
    setBusy("/api/profile/documents/upload");
    setMessage(null);
    try {
      const res = await fetch("/api/profile/documents/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.ok === false) {
        setMessage(data?.message || data?.code || "Document upload could not be saved.");
        return;
      }
      if (fileRef.current) fileRef.current.value = "";
      setMessage("Document uploaded privately.");
      router.refresh();
    } catch {
      setMessage("Document upload failed. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      {message ? (
        <div className="rounded-2xl border border-[#ff7a00]/25 bg-[#ff7a00]/10 px-4 py-3 text-sm text-[#ffbf82]">
          {message}
        </div>
      ) : null}

      <details className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <summary className="cursor-pointer text-sm font-bold text-white">Update travel preferences</summary>
        <form action={savePreferences} className="mt-4 grid gap-3 md:grid-cols-2">
          <input className={inputClass} name="travelStyles" placeholder="Styles: adventure, luxury" defaultValue={(travelPreference?.travelStyles || []).join(", ")} />
          <input className={inputClass} name="preferredRegions" placeholder="Regions: Europe, Asia" defaultValue={(travelPreference?.preferredRegions || []).join(", ")} />
          <input className={inputClass} name="preferredBudgetMin" type="number" min="0" placeholder="Minimum budget" defaultValue={travelPreference?.preferredBudgetMin || ""} />
          <input className={inputClass} name="preferredBudgetMax" type="number" min="0" placeholder="Maximum budget" defaultValue={travelPreference?.preferredBudgetMax || ""} />
          <input className={inputClass} name="preferredCurrency" placeholder="Currency" defaultValue={travelPreference?.preferredCurrency || "USD"} />
          <input className={inputClass} name="activityIntensity" placeholder="Pace: relaxed, balanced, intense" defaultValue={travelPreference?.activityIntensity || ""} />
          <input className={inputClass} name="hotelPreference" placeholder="Hotel preference" defaultValue={travelPreference?.hotelPreference || ""} />
          <input className={inputClass} name="preferredTransportation" placeholder="Transport preference" defaultValue={travelPreference?.preferredTransportation || ""} />
          <button className={`${buttonClass} md:col-span-2`} disabled={busy === "/api/profile/preferences"} type="submit">
            {busy === "/api/profile/preferences" ? "Saving..." : "Save Preferences"}
          </button>
        </form>
      </details>

      <details className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <summary className="cursor-pointer text-sm font-bold text-white">Add booking or trip reminder</summary>
        <form action={addReminder} className="mt-4 grid gap-3 md:grid-cols-2">
          <input className={inputClass} name="title" required placeholder="Reminder title" />
          <select className={inputClass} name="reminderType" defaultValue="trip">
            <option value="hotel">Hotel</option>
            <option value="flight">Flight</option>
            <option value="activity">Activity</option>
            <option value="transportation">Transportation</option>
            <option value="trip">Trip</option>
            <option value="passport">Passport</option>
            <option value="visa">Visa</option>
            <option value="custom">Custom</option>
          </select>
          <input className={inputClass} name="reminderDate" required type="datetime-local" />
          <input className={inputClass} name="tripName" placeholder="Trip name" />
          <textarea className={`${inputClass} md:col-span-2`} name="notes" rows={3} placeholder="Notes" />
          <button className={`${buttonClass} md:col-span-2`} disabled={busy === "/api/profile/reminders"} type="submit">
            {busy === "/api/profile/reminders" ? "Adding..." : "Add Reminder"}
          </button>
        </form>
      </details>

      <details className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <summary className="cursor-pointer text-sm font-bold text-white">Upload private travel document</summary>
        <form action={uploadDocument} className="mt-4 grid gap-3 md:grid-cols-2">
          <input className={inputClass} name="displayName" required placeholder="Document name" />
          <select className={inputClass} name="type" defaultValue="passport">
            <option value="passport">Passport</option>
            <option value="visa">Visa</option>
            <option value="insurance">Insurance</option>
            <option value="flight">Flight</option>
            <option value="hotel">Hotel</option>
            <option value="trip">Trip</option>
            <option value="other">Other</option>
          </select>
          <input ref={fileRef} className={`${inputClass} md:col-span-2`} name="file" required type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" />
          <input className={inputClass} name="expiryDate" type="date" />
          <input className={inputClass} name="tripId" placeholder="Optional trip ID" />
          <button className={`${buttonClass} md:col-span-2`} disabled={busy === "/api/profile/documents/upload"} type="submit">
            {busy === "/api/profile/documents/upload" ? "Uploading..." : "Upload Document"}
          </button>
        </form>
      </details>

      <details className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <summary className="cursor-pointer text-sm font-bold text-white">Contact support</summary>
        <form action={openTicket} className="mt-4 grid gap-3">
          <input className={inputClass} name="subject" required placeholder="Subject" />
          <select className={inputClass} name="priority" defaultValue="MEDIUM">
            <option value="LOW">Low priority</option>
            <option value="MEDIUM">Medium priority</option>
            <option value="HIGH">High priority</option>
          </select>
          <textarea className={inputClass} name="message" required rows={4} placeholder="How can we help?" />
          <button className={buttonClass} disabled={busy === "/api/profile/support"} type="submit">
            {busy === "/api/profile/support" ? "Sending..." : "Send Support Ticket"}
          </button>
        </form>
      </details>
    </div>
  );
}
