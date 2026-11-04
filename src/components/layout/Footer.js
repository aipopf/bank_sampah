import { Clock3, MapPin, Recycle } from "lucide-react";
import Link from "next/link";
import Container from "../ui/Container";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-emerald-950 text-white">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 sm:py-14 lg:grid-cols-[1.3fr_1fr_1fr] lg:gap-16">
        <div>
          <Link
            className="inline-flex items-center gap-2.5 text-base font-semibold"
            href="/"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-white/10">
              <Recycle aria-hidden="true" className="size-5 text-lime-200" />
            </span>
            Bank Sampah Digital
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">
            Langkah kecil untuk lingkungan yang lebih baik. Pilah hari ini,
            jaga bumi untuk esok.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Kunjungi kami</h2>
          <p className="mt-4 flex items-start gap-2.5 text-sm leading-6 text-white/65">
            <MapPin
              aria-hidden="true"
              className="mt-1 size-4 shrink-0 text-lime-200"
            />
            Alamat operasional akan diperbarui oleh pengelola bank sampah.
          </p>
        </div>

        <div id="kontak">
          <h2 className="text-sm font-semibold">Kontak & operasional</h2>
          <p className="mt-4 text-sm leading-6 text-white/65">
            Informasi kontak dan jadwal layanan dapat dikonfirmasi langsung
            kepada pengelola.
          </p>
          <p className="mt-3 flex items-center gap-2.5 text-sm text-white/65">
            <Clock3
              aria-hidden="true"
              className="size-4 shrink-0 text-lime-200"
            />
            Jadwal operasional akan diumumkan.
          </p>
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>Bank Sampah Digital</span>
          <span>Bersama mengurangi sampah, merawat masa depan.</span>
        </Container>
      </div>
    </footer>
  );
}
