"use client";

import { useState } from "react";

export default function AdminImageUploadField({
  label,
  bucket,
  value,
  onChange,
}: {
  label: string;
  bucket: "ready-plans" | "destinations" | "offers" | "events";
  value: string;
  onChange: (value: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("bucket", bucket);
      formData.append("file", file);
      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        throw new Error(data?.code || "UPLOAD_FAILED");
      }
      onChange(data.publicUrl);
    } catch (uploadError: any) {
      setError(uploadError?.message || "UPLOAD_FAILED");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <label className="block">
      <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-white/44">{label}</div>
      <div className="space-y-3">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
          placeholder="https://..."
        />
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            onChange={onFileChange}
            className="block w-full text-xs text-white/60 file:mr-4 file:rounded-full file:border-0 file:bg-[#ff7a00] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-black hover:file:bg-[#ff9330]"
          />
          {uploading ? <span className="text-xs text-white/60">Uploading...</span> : null}
        </div>
        {error ? <p className="text-xs text-red-300">{error}</p> : null}
      </div>
    </label>
  );
}
