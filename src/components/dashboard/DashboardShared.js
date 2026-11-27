import Link from "next/link";
import { Recycle } from "lucide-react";
import LogoutButton from "@/components/auth/LogoutButton";

export const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

export function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function DashboardFrame({ role, name, children }) {
  const greeting =
    role === "nasabah" ? "Kelola tabungan sampahmu dengan mudah." : "Siap melayani nasabah hari ini?";

  return (
    <main className="min-h-screen bg-[#f5f8f3] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-950/10 bg-white px-5 py-4 shadow-sm sm:px-7">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <Recycle aria-hidden="true" className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-bold text-emerald-950">
                Bank Sampah
              </span>
              <span className="block text-xs text-emerald-700">Digital</span>
            </span>
          </Link>
          <LogoutButton />
        </header>

        <section className="py-8 sm:py-10">
          <p className="text-sm font-semibold capitalize text-emerald-700">
            Dashboard {role}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl">
            Halo, {name}
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">{greeting}</p>
        </section>

        {children}
      </div>
    </main>
  );
}

export function MetricCard({ label, value, detail, icon: Icon }) {
  return (
    <article className="rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-950">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </div>
    </article>
  );
}

export function SectionHeading({ title, description }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-bold text-emerald-950">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    disetujui: "bg-emerald-50 text-emerald-800",
    dibayar: "bg-emerald-50 text-emerald-800",
    menunggu: "bg-amber-50 text-amber-800",
    ditolak: "bg-rose-50 text-rose-800",
    dibatalkan: "bg-slate-100 text-slate-600",
  };
  const labels = {
    disetujui: "Disetujui",
    dibayar: "Dibayar",
    menunggu: "Menunggu",
    ditolak: "Ditolak",
    dibatalkan: "Dibatalkan",
  };
  const normalizedStatus = status ?? "menunggu";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[normalizedStatus] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {labels[normalizedStatus] ?? normalizedStatus}
    </span>
  );
}

export function EmptyState({ children }) {
  return (
    <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {children}
    </p>
  );
}
