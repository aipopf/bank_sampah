"use client";

import { useActionState } from "react";
import {
  markWithdrawalPaidAction,
  recordDepositAction,
  withdrawalAction,
} from "@/app/dashboard-actions";

function ActionMessage({ state }) {
  if (!state?.error && !state?.success) return null;

  return (
    <p
      aria-live="polite"
      className={`mt-3 text-sm ${
        state.error ? "text-rose-700" : "text-emerald-700"
      }`}
      role={state.error ? "alert" : "status"}
    >
      {state.error ?? state.success}
    </p>
  );
}

export function WithdrawalForm() {
  const [state, formAction, pending] = useActionState(withdrawalAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-sm font-medium text-slate-700" htmlFor="jumlah">
        Nominal penarikan
        <input
          required
          min="1"
          name="jumlah"
          id="jumlah"
          type="number"
          inputMode="numeric"
          placeholder="Contoh: 50000"
          className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
        />
      </label>
      <button
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Mengirim permintaan..." : "Ajukan penarikan"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

export function DepositForm({ customers, wasteTypes }) {
  const [state, formAction, pending] = useActionState(recordDepositAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-sm font-medium text-slate-700" htmlFor="nasabah_id">
        Nasabah
        <select
          required
          defaultValue=""
          name="nasabah_id"
          id="nasabah_id"
          className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
        >
          <option disabled value="">Pilih nasabah</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.nama}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-700" htmlFor="jenis_sampah_id">
        Jenis sampah
        <select
          required
          defaultValue=""
          name="jenis_sampah_id"
          id="jenis_sampah_id"
          className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
        >
          <option disabled value="">Pilih jenis sampah</option>
          {wasteTypes.map((wasteType) => (
            <option key={wasteType.id} value={wasteType.id}>
              {wasteType.nama_sampah} — Rp
              {new Intl.NumberFormat("id-ID").format(wasteType.harga_per_kg)}/
              {wasteType.satuan ?? "kg"}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-700" htmlFor="berat">
        Berat (kg)
        <input
          required
          min="0.01"
          step="0.01"
          name="berat"
          id="berat"
          type="number"
          inputMode="decimal"
          placeholder="Contoh: 2.5"
          className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
        />
      </label>
      <button
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
        disabled={pending || customers.length === 0 || wasteTypes.length === 0}
        type="submit"
      >
        {pending ? "Mencatat setoran..." : "Catat setoran"}
      </button>
      {customers.length === 0 || wasteTypes.length === 0 ? (
        <p className="text-xs text-amber-700">
          Form belum tersedia karena data nasabah atau jenis sampah aktif belum ada.
        </p>
      ) : null}
      <ActionMessage state={state} />
    </form>
  );
}

export function MarkWithdrawalPaidForm({ withdrawalId }) {
  const [state, formAction, pending] = useActionState(
    markWithdrawalPaidAction,
    null,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="penarikan_id" value={withdrawalId} />
      <button
        className="min-h-9 rounded-lg border border-emerald-700/20 px-3 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Memproses..." : "Konfirmasi bayar"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}
