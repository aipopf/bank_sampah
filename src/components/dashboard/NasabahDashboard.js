import { ArrowDownToLine, Recycle, Wallet } from "lucide-react";
import {
  DashboardFrame,
  EmptyState,
  formatCurrency,
  formatDate,
  MetricCard,
  SectionHeading,
  StatusBadge,
} from "@/components/dashboard/DashboardShared";
import { WithdrawalForm } from "@/components/dashboard/DashboardForms";

export default function NasabahDashboard({
  profile,
  deposits,
  withdrawals,
  wasteTypes,
}) {
  const depositedWeight = deposits.reduce(
    (total, deposit) => total + Number(deposit.total_berat ?? 0),
    0,
  );

  return (
    <DashboardFrame name={profile.nama} role="nasabah">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          detail="Saldo tabungan tersedia"
          icon={Wallet}
          label="Saldo saya"
          value={formatCurrency(profile.saldo)}
        />
        <MetricCard
          detail="Akumulasi dari riwayat setoran terbaru"
          icon={Recycle}
          label="Berat terkumpul"
          value={`${depositedWeight.toLocaleString("id-ID")} kg`}
        />
        <MetricCard
          detail="Jenis sampah yang dapat disetorkan"
          icon={ArrowDownToLine}
          label="Jenis sampah aktif"
          value={wasteTypes.length}
        />
      </section>

      <section className="mt-6 grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <article className="rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeading
              description="Maksimal 6 setoran terbaru."
              title="Riwayat setoran"
            />
            {deposits.length === 0 ? (
              <EmptyState>Belum ada riwayat setoran.</EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b border-slate-100 text-xs text-slate-500">
                    <tr>
                      <th className="pb-3 font-medium">Tanggal</th>
                      <th className="pb-3 font-medium">Berat</th>
                      <th className="pb-3 font-medium">Nilai</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deposits.map((deposit) => (
                      <tr key={deposit.id}>
                        <td className="py-3 text-slate-700">
                          {formatDate(deposit.tanggal_setoran)}
                        </td>
                        <td className="py-3 text-slate-700">
                          {Number(deposit.total_berat).toLocaleString("id-ID")} kg
                        </td>
                        <td className="py-3 font-medium text-emerald-900">
                          {formatCurrency(deposit.total_harga)}
                        </td>
                        <td className="py-3">
                          <StatusBadge status={deposit.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeading
              description="Harga mengikuti daftar jenis sampah yang aktif."
              title="Harga sampah"
            />
            {wasteTypes.length === 0 ? (
              <EmptyState>Belum ada jenis sampah aktif.</EmptyState>
            ) : (
              <ul className="divide-y divide-slate-100">
                {wasteTypes.map((wasteType) => (
                  <li
                    className="flex items-center justify-between gap-4 py-3 text-sm"
                    key={wasteType.id}
                  >
                    <span className="font-medium text-slate-700">
                      {wasteType.nama_sampah}
                    </span>
                    <span className="text-emerald-800">
                      {formatCurrency(wasteType.harga_per_kg)}/
                      {wasteType.satuan ?? "kg"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>

        <div className="space-y-6">
          <article className="rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeading
              description="Ajukan pencairan saldo tabunganmu."
              title="Tarik saldo"
            />
            <WithdrawalForm />
          </article>

          <article className="rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeading
              description="Maksimal 5 permintaan terbaru."
              title="Riwayat penarikan"
            />
            {withdrawals.length === 0 ? (
              <EmptyState>Belum ada permintaan penarikan.</EmptyState>
            ) : (
              <ul className="divide-y divide-slate-100">
                {withdrawals.map((withdrawal) => (
                  <li className="py-3" key={withdrawal.id}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-emerald-950">
                        {formatCurrency(withdrawal.jumlah)}
                      </span>
                      <StatusBadge
                        status={
                          withdrawal.status_pembayaran === "dibayar"
                            ? "dibayar"
                            : withdrawal.status
                        }
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(withdrawal.tanggal_penarikan)}
                      {withdrawal.status === "disetujui" &&
                      withdrawal.status_pembayaran === "menunggu"
                        ? " · Menunggu pembayaran"
                        : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </section>
    </DashboardFrame>
  );
}
