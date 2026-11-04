import Link from "next/link";
import { ArrowUpRight, Recycle } from "lucide-react";
import LogoutButton from "@/components/auth/LogoutButton";

const dashboardLabels = {
  admin: "Administrator",
  petugas: "Petugas",
  nasabah: "Nasabah",
};

export default function DashboardHome({ role }) {
  const roleLabel = dashboardLabels[role];

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
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

        <section className="mt-8 rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:mt-10 sm:p-10">
          <p className="text-sm font-semibold text-emerald-700">
            Dashboard {roleLabel}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-emerald-950 sm:text-4xl">
            Berhasil masuk
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Sesi Anda aktif dan akses halaman ini telah diverifikasi berdasarkan
            role akun pada profil.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
            <ArrowUpRight aria-hidden="true" className="size-4" />
            Akses diberikan sebagai {roleLabel.toLowerCase()}.
          </div>
        </section>
      </div>
    </main>
  );
}
