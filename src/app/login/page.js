import Link from "next/link";
import { ArrowLeft, Recycle, ShieldCheck } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Masuk | Bank Sampah Digital",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6">
      <section className="w-full max-w-md">
        <Link
          aria-label="Kembali ke beranda"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-emerald-800"
          href="/"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Kembali ke beranda
        </Link>

        <div className="rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-[0_24px_80px_-40px_rgba(6,78,59,0.3)] sm:p-9">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-700 text-white">
            <Recycle aria-hidden="true" className="size-6" />
          </div>
          <p className="mt-6 text-sm font-semibold tracking-wide text-emerald-700">
            BANK SAMPAH DIGITAL
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-emerald-950">
            Selamat datang
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Masuk menggunakan email dan password akun Anda.
          </p>

          <LoginForm />

          <p className="mt-6 flex items-start gap-2 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-emerald-700"
            />
            Akses dashboard ditentukan dari role akun yang tersimpan di server.
          </p>
        </div>
      </section>

      <div className="mt-8 w-full max-w-md rounded-3xl border border-slate-200 bg-slate-100 p-6 text-center text-sm text-slate-600 shadow-sm sm:p-9">
      <div className="space-y-1">
        <p>admin_test@gmail.com</p>
        <p>pw: admin_test</p>
        <p>----------------------------------</p>

        <p className="pt-2">petugas_test@gmail.com</p>
        <p>pw: petugas_test</p>
        <p>----------------------------------</p>

        <p className="pt-2">nasabah_test@gmail.com</p>
        <p>pw: nasabah_test</p>
        
      </div>
      </div>
    </main>

    
  );
}
