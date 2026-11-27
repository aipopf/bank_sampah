import { ClipboardCheck, Recycle, Wallet } from "lucide-react";
import {
  DashboardFrame,
  EmptyState,
  formatCurrency,
  formatDate,
  MetricCard,
  SectionHeading,
  StatusBadge,
} from "@/components/dashboard/DashboardShared";
import {
  DepositForm,
  MarkWithdrawalPaidForm,
} from "@/components/dashboard/DashboardForms";

export default function PetugasDashboard({
  profile,
  customers,
  wasteTypes,
  deposits,
  withdrawals,
  withdrawalCustomers,
}) {
  const customerNames = new Map(
    withdrawalCustomers.map((customer) => [customer.id, customer.nama]),
  );
  const depositedWeight = deposits.reduce(
    (total, deposit) => total + Number(deposit.total_berat ?? 0),
    0,
  );

  return (
    <DashboardFrame name={profile.nama} role="petugas">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          detail="Catatan setoran terbaru"
          icon={Recycle}
          label="Setoran tercatat"
          value={deposits.length}
        />
        <MetricCard
          detail="Dari catatan setoran terbaru"
          icon={ClipboardCheck}
          label="Berat diterima"
          value={`${depositedWeight.toLocaleString("id-ID")} kg`}
        />
        <MetricCard
          detail="Menunggu konfirmasi pembayaran"
          icon={Wallet}
          label="Penarikan perlu dibayar"
          value={withdrawals.length}
        />
      </section>

      <section className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-6">
          <article className="rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeading
              description="Nilai setoran dihitung memakai harga resmi."
              title="Catat setoran nasabah"
            />
            <DepositForm customers={customers} wasteTypes={wasteTypes} />
          </article>

          <article className="rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeading
              description="Permintaan yang sudah disetujui dan belum dibayar."
              title="Pembayaran penarikan"
            />
            {withdrawals.length === 0 ? (
              <EmptyState>Tidak ada penarikan yang menunggu pembayaran.</EmptyState>
            ) : (
              <ul className="divide-y divide-slate-100">
                {withdrawals.map((withdrawal) => (
                  <li className="py-4" key={withdrawal.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-emerald-950">
                          {customerNames.get(withdrawal.nasabah_id) ??
                            "Nasabah"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatCurrency(withdrawal.jumlah)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(withdrawal.tanggal_penarikan)}
                        </p>
                      </div>
                      <MarkWithdrawalPaidForm withdrawalId={withdrawal.id} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>

        <article className="rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading
            description="Maksimal 8 transaksi terbaru yang dicatat akun Anda."
            title="Setoran terbaru"
          />
          {deposits.length === 0 ? (
            <EmptyState>Belum ada setoran yang dicatat.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="border-b border-slate-100 text-xs text-slate-500">
                  <tr>
                    <th className="pb-3 font-medium">Nasabah</th>
                    <th className="pb-3 font-medium">Tanggal</th>
                    <th className="pb-3 font-medium">Berat</th>
                    <th className="pb-3 font-medium">Nilai</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deposits.map((deposit) => (
                    <tr key={deposit.id}>
                      <td className="py-3 font-medium text-slate-700">
                        {customers.find(
                          (customer) => customer.id === deposit.nasabah_id,
                        )?.nama ?? "Nasabah"}
                      </td>
                      <td className="py-3 text-slate-600">
                        {formatDate(deposit.tanggal_setoran)}
                      </td>
                      <td className="py-3 text-slate-600">
                        {Number(deposit.total_berat).toLocaleString("id-ID")} kg
                      </td>
                      <td className="py-3 text-emerald-900">
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
      </section>
    </DashboardFrame>
  );
}
