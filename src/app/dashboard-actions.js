"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function readPositiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export async function withdrawalAction(_previousState, formData) {
  const amount = readPositiveNumber(formData.get("jumlah"));

  if (!amount) {
    return { error: "Masukkan nominal penarikan yang valid." };
  }

  await requireRole("nasabah");
  const supabase = await createClient();
  const { error } = await supabase.rpc("ajukan_penarikan", {
    p_jumlah: amount,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/nasabah");
  return { success: "Permintaan penarikan berhasil diajukan." };
}

export async function recordDepositAction(_previousState, formData) {
  const customerId = formData.get("nasabah_id");
  const wasteTypeId = Number(formData.get("jenis_sampah_id"));
  const weight = readPositiveNumber(formData.get("berat"));

  if (
    typeof customerId !== "string" ||
    !customerId ||
    !Number.isSafeInteger(wasteTypeId) ||
    wasteTypeId <= 0 ||
    !weight
  ) {
    return { error: "Lengkapi nasabah, jenis sampah, dan berat dengan benar." };
  }

  await requireRole("petugas");
  const supabase = await createClient();
  const { error } = await supabase.rpc("catat_setoran", {
    p_nasabah_id: customerId,
    p_detail: [{ jenis_sampah_id: wasteTypeId, berat: weight }],
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/petugas");
  return { success: "Setoran berhasil dicatat." };
}

export async function markWithdrawalPaidAction(_previousState, formData) {
  const withdrawalId = Number(formData.get("penarikan_id"));

  if (!Number.isSafeInteger(withdrawalId) || withdrawalId <= 0) {
    return { error: "ID penarikan tidak valid." };
  }

  await requireRole("petugas");
  const supabase = await createClient();
  const { error } = await supabase.rpc("tandai_penarikan_dibayar", {
    p_penarikan_id: withdrawalId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/petugas");
  return { success: "Pembayaran berhasil dikonfirmasi." };
}
