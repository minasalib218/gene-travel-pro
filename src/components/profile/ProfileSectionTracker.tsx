"use client";

import { useEffect } from "react";

const sections = [
  "profile-overview",
  "my-trips",
  "favorite-plans",
  "bookings-reminders",
  "my-credits",
  "travel-preferences",
  "travel-documents",
  "special-offers",
  "notifications",
  "support",
  "account-security",
];

export default function ProfileSectionTracker() {
  useEffect(() => {
    const seen = new Set<string>();
    const nodes = sections
      .map((section) => document.getElementById(section))
      .filter((node): node is HTMLElement => Boolean(node));

    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const section = entry.target.id;
          if (!entry.isIntersecting || seen.has(section)) return;
          seen.add(section);
          fetch("/api/profile/section", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ section }),
            keepalive: true,
          }).catch(() => null);
        });
      },
      { threshold: 0.35 },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return null;
}
