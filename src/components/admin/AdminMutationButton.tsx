"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminMutationButton({
  endpoint,
  method = "POST",
  payload,
  label,
  confirmMessage,
  className = "",
  reload = true,
}: {
  endpoint: string;
  method?: "POST" | "PATCH" | "DELETE";
  payload?: Record<string, unknown>;
  label: string;
  confirmMessage?: string;
  className?: string;
  reload?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        if (confirmMessage && !window.confirm(confirmMessage)) return;
        setLoading(true);
        try {
          const response = await fetch(endpoint, {
            method,
            headers: payload ? { "Content-Type": "application/json" } : undefined,
            body: payload ? JSON.stringify(payload) : undefined,
          });
          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data?.message || data?.code || "Request failed");
          }
          if (reload) {
            router.refresh();
            window.location.reload();
          }
        } catch (error: any) {
          window.alert(error?.message || "Action failed");
        } finally {
          setLoading(false);
        }
      }}
      className={className}
    >
      {loading ? "Working..." : label}
    </button>
  );
}
