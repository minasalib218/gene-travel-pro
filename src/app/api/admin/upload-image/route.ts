import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { uploadAdminImage } from "@/lib/supabase/storage";
import { adminImageBucketSchema } from "@/lib/content/shared";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  const code = typeof (admin as any)?.code === "string" ? (admin as any).code : "FORBIDDEN";
  if (!admin.ok) return NextResponse.json({ ok: false, code }, { status: 403 });

  try {
    const formData = await req.formData();
    const bucket = adminImageBucketSchema.parse(formData.get("bucket"));
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, code: "FILE_REQUIRED" }, { status: 400 });
    }

    const uploaded = await uploadAdminImage(bucket, file);
    return NextResponse.json({ ok: true, ...uploaded });
  } catch (error: any) {
    const message = error?.message || "UPLOAD_FAILED";
    const code =
      message === "INVALID_IMAGE_TYPE" || message === "IMAGE_TOO_LARGE"
        ? message
        : "UPLOAD_FAILED";
    return NextResponse.json({ ok: false, code, message }, { status: 400 });
  }
}
