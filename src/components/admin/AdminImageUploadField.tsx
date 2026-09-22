"use client";

import { useState } from "react";
import { imageUploadConstraintsLabel } from "@/lib/content/shared";
import { prepareImageForUpload } from "@/lib/client/prepareImageForUpload";

function getUploadErrorMessage(codeOrMessage: string) {
  switch (codeOrMessage) {
    case "INVALID_IMAGE_TYPE":
      return `Unsupported image format. Please upload ${imageUploadConstraintsLabel.allowedTypesText}.`;
    case "IMAGE_TOO_LARGE":
      return `Image is too large. Please keep it under ${imageUploadConstraintsLabel.maxSizeText}.`;
    case "NOT_AUTHED":
    case "NOT_ADMIN":
    case "PROFILE_NOT_PROVISIONED":
    case "SUPABASE_AUTH_ERROR":
      return "Your admin session expired. Please sign in again and retry the upload.";
    default:
      return codeOrMessage || "UPLOAD_FAILED";
  }
}

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
  const [uploadPhase, setUploadPhase] = useState<"optimizing" | "uploading" | "">("");
  const [error, setError] = useState("");

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadPhase("optimizing");
    setError("");
    try {
      const prepared = await prepareImageForUpload(file);
      setUploadPhase("uploading");
      const formData = new FormData();
      formData.append("bucket", bucket);
      formData.append("file", prepared.file);
      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || data?.code || "UPLOAD_FAILED");
      }
      onChange(data.publicUrl);
    } catch (uploadError: any) {
      setError(getUploadErrorMessage(uploadError?.message));
    } finally {
      setUploading(false);
      setUploadPhase("");
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
          {uploading ? (
            <div className="flex min-w-[170px] items-center gap-2">
              <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-[#ff7a00]" />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-white/60">
                  {uploadPhase === "optimizing" ? "Optimizing image..." : "Uploading..."}
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-1/2 animate-pulse rounded-full bg-[#ff7a00]" />
                </div>
              </div>
            </div>
          ) : null}
        </div>
        {error ? <p className="text-xs text-red-300">{error}</p> : null}
      </div>
    </label>
  );
}
