import { ArrowLeft, Leaf } from "lucide-react";
import Link from "next/link";
import Button from "./Button";
import Container from "./Container";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center bg-[#f7f9f4] py-20">
      <Container className="text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
          <Leaf aria-hidden="true" className="size-8" />
        </div>
        <p className="mt-8 text-sm font-bold tracking-[0.2em] text-emerald-700">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-emerald-950 sm:text-5xl">
          Halaman tidak ditemukan
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-600">
          Sepertinya halaman yang kamu cari belum tersedia atau alamatnya
          berubah.
        </p>
        <Button href="/" className="mt-8">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Kembali ke beranda
        </Button>
        <p className="mt-8 text-sm text-slate-500">
          <Link className="underline decoration-emerald-700/40 underline-offset-4 hover:text-emerald-800" href="/">
            Bank Sampah Digital
          </Link>
        </p>
      </Container>
    </main>
  );
}
