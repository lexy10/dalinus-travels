"use server";

import { redirect } from "next/navigation";
import { auth } from "@/infra/auth/auth";
import { bookingService, paymentService } from "@/infra/composition";
import type { FormState } from "./auth";

export async function createBookingAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await auth();
  if (!session?.user) {
    return { status: "error", message: "You must be signed in to book." };
  }
  const tourPackageId = String(formData.get("tourPackageId") ?? "");
  const reservedPlaces = Number(formData.get("reservedPlaces") ?? 1);

  const booking = await bookingService.createPendingBooking({
    travelerId: session.user.id,
    tourPackageId,
    reservedPlaces,
  });
  if (!booking.ok) return { status: "error", message: booking.error.message };

  const init = await paymentService.initiateForBooking(booking.value.id, {
    email: session.user.email ?? "",
    name: session.user.name ?? undefined,
  });
  if (!init.ok) return { status: "error", message: init.error.message };

  redirect(init.value.checkoutUrl);
}
