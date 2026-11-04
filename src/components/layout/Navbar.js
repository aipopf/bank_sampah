import { ArrowUpRight, Recycle } from "lucide-react";
import Link from "next/link";
import Button from "../ui/Button";
import Container from "../ui/Container";

const links = [
  ["Beranda", "#beranda"],
  ["Tentang Kami", "#tentang"],
  ["Jenis Sampah", "#jenis-sampah"],
  ["Harga Sampah", "#harga-sampah"],
  ["Prosedur", "#prosedur"],
  ["Kontak", "#kontak"],
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-emerald-950/5 bg-[#fbfcf9]/95 shadow-[0_8px_24px_-22px_rgba(6,78,59,0.5)] backdrop-blur-md">
      <Container className="flex min-h-[72px] flex-wrap items-center justify-between gap-x-5 gap-y-2 py-3">
        <Link
          aria-label="Bank Sampah Digital, beranda"
          className="flex shrink-0 items-center gap-2.5"
          href="/"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-800 text-white">
            <Recycle aria-hidden="true" className="size-[18px]" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-tight text-emerald-950">
              Bank Sampah
            </span>
            <span className="block text-xs font-medium text-emerald-700">
              Digital
            </span>
          </span>
        </Link>

        <Button
          className="min-h-10 px-4 py-2 text-xs sm:text-sm"
          href="/login"
          variant="secondary"
        >
          Masuk
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Button>

        <nav
          aria-label="Navigasi utama"
          className="order-3 -mx-5 flex w-[calc(100%+2.5rem)] items-center gap-5 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:w-[calc(100%+4rem)] sm:px-8 lg:order-0 lg:mx-0 lg:w-auto lg:flex-1 lg:justify-center lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0"
        >
          {links.map(([label, href]) => (
            <Link
              className="shrink-0 py-1 text-xs font-medium text-slate-600 transition-colors hover:text-emerald-800 sm:text-sm"
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
}
