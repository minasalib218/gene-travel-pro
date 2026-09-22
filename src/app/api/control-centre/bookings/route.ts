import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/requireUser";
import { isControlCentreFeatureEnabled } from "@/lib/control-centre/featureFlags";
import { updateCustomerBooking } from "@/lib/control-centre/repository";
import { canEncryptBookingReferences, encryptBookingReference } from "@/lib/control-centre/encryption";

export const dynamic = "force-dynamic";

const schema = z.object({
  planId: z.string().uuid(),
  itemId: z.string().uuid(),
  response: z.enum(["YES_BOOKED", "NOT_YET", "OTHER_PROVIDER", "REMIND_LATER"]),
  finalPrice: z.number().nonnegative().finite().optional(),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/).optional(),
  bookedAt: z.string().datetime().optional(),
  bookingReference: z.string().trim().max(200).optional(),
  cancellationDeadline: z.string().datetime().optional(),
  notes: z.string().trim().max(1000).optional(),
}).superRefine((value, context) => {
  if ((value.finalPrice == null) !== (value.currency == null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Price and currency must be supplied together." });
  }
});

export async function POST(request: NextRequest) {
  if (!isControlCentreFeatureEnabled("bookingTracking")) {
    return NextResponse.json({ ok: false, code: "FEATURE_DISABLED" }, { status: 404 });
  }
  const auth = await requireUser();
  if (!auth.ok) return NextResponse.json({ ok: false, code: auth.code }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  const input = parsed.data;

  if (input.bookingReference && !canEncryptBookingReferences()) {
    return NextResponse.json(
      { ok: false, code: "BOOKING_REFERENCE_STORAGE_UNAVAILABLE" },
      { status: 503 },
    );
  }

  const status = input.response === "YES_BOOKED" || input.response === "OTHER_PROVIDER"
    ? "CUSTOMER_CONFIRMED"
    : input.response === "NOT_YET" || input.response === "REMIND_LATER"
      ? "BOOKING_PENDING"
      : "BOOKING_PENDING";

  const updated = await updateCustomerBooking({
    userId: auth.user.id,
    planId: input.planId,
    itemId: input.itemId,
    status,
    finalPrice: input.finalPrice,
    currency: input.currency,
    bookedAt: input.bookedAt ? new Date(input.bookedAt) : status === "CUSTOMER_CONFIRMED" ? new Date() : null,
    bookingReferenceCiphertext: input.bookingReference ? encryptBookingReference(input.bookingReference) : null,
    cancellationDeadline: input.cancellationDeadline ? new Date(input.cancellationDeadline) : null,
    notes: input.notes,
    providerEvidence: input.response === "OTHER_PROVIDER"
      ? { confirmationSource: "CUSTOMER", bookingSource: "OTHER_PROVIDER" }
      : { confirmationSource: "CUSTOMER", bookingSource: "GENE_AFFILIATE" },
  });

  if (!updated) return NextResponse.json({ ok: false, code: "INVALID_STATE_OR_NOT_FOUND" }, { status: 409 });
  return NextResponse.json({
    ok: true,
    booking: { id: updated.id, status: updated.status, version: updated.version },
    bookingReferenceStored: Boolean(input.bookingReference),
  });
}
