"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminTable } from "@/components/admin/AdminTable";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);

  async function load() {
    const response = await fetch("/api/admin/support", { cache: "no-store" });
    const data = await response.json();
    setTickets(data.tickets ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Support"
        title="Support inbox and issue tracking"
        description="Review refund requests, payment problems, AI issues, booking link reports, and agency-package requests from one place."
      />

      <AdminCard>
        <div className="text-sm font-semibold text-white">New ticket</div>
        <form
          className="mt-4 grid gap-4 md:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            await fetch("/api/admin/support", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: formData.get("email"),
                subject: formData.get("subject"),
                message: formData.get("message"),
                priority: formData.get("priority"),
                status: "OPEN",
              }),
            });
            (event.target as HTMLFormElement).reset();
            await load();
          }}
        >
          <input name="email" placeholder="Customer email" className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white" />
          <input name="subject" placeholder="Issue type or subject" className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white" />
          <textarea name="message" placeholder="Message" className="min-h-[120px] rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white md:col-span-2" />
          <select name="priority" className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white">
            {["LOW", "MEDIUM", "HIGH"].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
          <button className="rounded-2xl bg-[#ff7a00] px-5 py-3 text-sm font-semibold text-black">Create ticket</button>
        </form>
      </AdminCard>

      <AdminTable
        headers={["User", "Issue", "Message", "Status", "Priority", "Created"]}
        rows={tickets.map((ticket) => [
          <div key={`${ticket.id}-user`} className="text-sm text-white/75">{ticket.profile?.fullName || ticket.email}</div>,
          <div key={`${ticket.id}-issue`} className="text-sm text-white/75">{ticket.subject || "Other"}</div>,
          <div key={`${ticket.id}-message`} className="max-w-md text-sm text-white/75">{ticket.message}</div>,
          <div key={`${ticket.id}-status`} className="text-sm text-white/75">{ticket.status}</div>,
          <div key={`${ticket.id}-priority`} className="text-sm text-white/75">{ticket.priority}</div>,
          <div key={`${ticket.id}-created`} className="text-sm text-white/75">{new Date(ticket.createdAt).toLocaleDateString()}</div>,
        ])}
      />
    </div>
  );
}
