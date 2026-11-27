import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleDollarSign,
  Leaf,
  Recycle,
  Scale,
  Sprout,
} from "lucide-react";
import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";
import ScrollReveal from "../components/landing/ScrollReveal";
import StoryOpening from "../components/landing/StoryOpening";
import Container from "../components/ui/Container";

const samplePrices = [
  { name: "Botol plastik PET", price: "Rp 2.500" },
  { name: "Kardus bersih", price: "Rp 1.500" },
  { name: "Kertas campur", price: "Rp 1.000" },
  { name: "Kaleng aluminium", price: "Rp 4.000" },
];

const acceptedMaterials = [
  ["01", "Plastik", "Botol dan gelas plastik yang bersih dan kering."],
  ["02", "Kertas & kardus", "Kertas, koran, dan kardus yang tidak basah."],
  ["03", "Logam", "Kaleng dan barang berbahan logam yang dapat didaur ulang."],
];

const steps = [
  {
    number: "01",
    title: "Pilah",
    description: "Pisahkan sampah berdasarkan jenisnya dari rumah.",
    icon: Recycle,
  },
  {
    number: "02",
    title: "Setorkan",
    description: "Bawa sampah terpilah ke bank sampah.",
    icon: ArrowUpRight,
  },
  {
    number: "03",
    title: "Ditimbang",
    description: "Petugas menimbang dan mencatat hasil setoran.",
    icon: Scale,
  },
  {
    number: "04",
    title: "Saldo bertambah",
    description: "Nilai setoran tercatat sebagai manfaat untuk Anda.",
    icon: CircleDollarSign,
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <StoryOpening />

      <main className="flex-1">
        <section
          aria-labelledby="solution-title"
          className="overflow-hidden bg-[#f4f3e8] pb-20 sm:pb-28"
          id="perubahan"
        >
          <div aria-hidden="true" className="story-transition" />
          <Container className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <ScrollReveal>
              
              <h2
                className="mt-5 max-w-xl text-4xl leading-tight font-semibold tracking-[-0.04em] text-emerald-950 sm:text-5xl"
                id="solution-title"
              >
                PERUBAHAN BISA DIMULAI DARI DIRI SENDIRI
              </h2>
              <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Sampah bukan hanya sesuatu yang harus dibuang. Jika dikelola
                dengan benar, sampah memiliki nilai.
              </p>
              <a
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
                href="#beranda"
              >
                Mulai dari langkah sederhana
                <ArrowDownRight aria-hidden="true" className="size-4" />
              </a>
            </ScrollReveal>

            <ScrollReveal className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem]">
                <Image
                  alt="Lingkungan yang lebih bersih dengan tempat sampah terpilah"
                  className="object-cover"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  src="/images/lingkungan-bersih.jpg"
                />
              </div>
              
            </ScrollReveal>
          </Container>
        </section>

        <Navbar />

        <section
          aria-labelledby="hero-title"
          className="overflow-hidden bg-[#fbfcf9] py-20 sm:py-28 lg:py-32"
          id="beranda"
        >
          <Container className="grid items-center gap-14 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
            <ScrollReveal>
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white px-3.5 py-2 text-xs font-semibold tracking-wide text-emerald-800">
                <Leaf aria-hidden="true" className="size-4" />
                LANGKAH KECIL, DAMPAK BESAR
              </p>
              <h2
                className="mt-6 max-w-2xl text-5xl leading-[1.04] font-semibold tracking-[-0.05em] text-emerald-950 sm:text-6xl lg:text-7xl"
                id="hero-title"
              >
                Ubah Sampah Menjadi{" "}
                <span className="text-emerald-700">Manfaat.</span>
              </h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Mulai kebiasaan memilah sampah, setor, dan dapatkan manfaatnya
                melalui layanan Bank Sampah kami.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
                  href="/register"
                >
                  Daftar Menjadi Nasabah
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
                <a
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-900/15 bg-white px-6 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
                  href="#prosedur"
                >
                  Pelajari Cara Kerjanya
                </a>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Isi formulir untuk membuat akun nasabah Bank Sampah Digital.
              </p>
            </ScrollReveal>

            <ScrollReveal className="relative mx-auto w-full max-w-xl">
              <div className="absolute -right-7 -top-8 size-36 rounded-full bg-lime-200/60 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] bg-emerald-100 p-3 shadow-[0_30px_90px_-40px_rgba(6,78,59,0.35)] sm:p-4">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem]">
                  <Image
                    alt="Warga memilah dan mengumpulkan barang yang dapat didaur ulang"
                    className="object-cover"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    src="/images/images.jpg"
                  />
                </div>
                <div className="flex items-center justify-between gap-4 px-2 py-4 sm:px-3 sm:py-5">
                  <div>
                    <p className="text-xs text-emerald-900/65">
                      Perubahan dimulai
                    </p>
                    <p className="mt-1 text-sm font-semibold text-emerald-950">
                      dari rumah kita
                    </p>
                  </div>
                  <span className="flex size-11 items-center justify-center rounded-full bg-white text-emerald-800">
                    <Recycle aria-hidden="true" className="size-5" />
                  </span>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </section>

        <section
          aria-labelledby="about-title"
          className="bg-white py-20 sm:py-24"
          id="tentang"
        >
          <Container className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-start md:gap-16">
            <ScrollReveal>
              <p className="text-xs font-semibold tracking-[0.2em] text-emerald-700 uppercase">
                Tentang bank sampah
              </p>
              <h2
                className="mt-4 max-w-md text-3xl leading-tight font-semibold tracking-[-0.035em] text-emerald-950 sm:text-4xl"
                id="about-title"
              >
                Nilai baru dari kebiasaan yang lebih bijak.
              </h2>
            </ScrollReveal>
            <ScrollReveal>
              <p className="text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Bank sampah menghubungkan kebiasaan memilah dengan pengelolaan
                yang lebih bertanggung jawab. Sampah yang masih bernilai
                dikumpulkan, ditimbang, lalu dicatat sebagai manfaat bagi
                nasabah.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#f4f3e8] p-5">
                  <Sprout
                    aria-hidden="true"
                    className="size-5 text-emerald-800"
                  />
                  <h3 className="mt-4 text-sm font-semibold text-emerald-950">
                    Lingkungan lebih terjaga
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Sampah terpilah lebih mudah dikelola dan dimanfaatkan
                    kembali.
                  </p>
                </div>
                <div className="rounded-2xl bg-[#f4f3e8] p-5">
                  <CircleDollarSign
                    aria-hidden="true"
                    className="size-5 text-emerald-800"
                  />
                  <h3 className="mt-4 text-sm font-semibold text-emerald-950">
                    Ada manfaat untuk nasabah
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Setoran tercatat dan dapat dihargai sesuai ketentuan
                    pengelola.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </section>

        <section
          aria-labelledby="materials-title"
          className="bg-[#f4f3e8] py-20 sm:py-24"
          id="jenis-sampah"
        >
          <Container>
            <ScrollReveal className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold tracking-[0.2em] text-emerald-700 uppercase">
                Kenali sebelum menyetor
              </p>
              <h2
                className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-emerald-950 sm:text-4xl"
                id="materials-title"
              >
                Jenis sampah yang dapat dipilah
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
                Berikut contoh material yang umumnya dapat dikelola. Jenis yang
                diterima dapat berbeda sesuai ketentuan bank sampah.
              </p>
            </ScrollReveal>

            <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <ScrollReveal className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem]">
                <Image
                  alt="Warga memilah botol dan material daur ulang"
                  className="object-cover"
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  src="/images/images.jpg"
                />
              </ScrollReveal>
              <div className="grid gap-3">
                {acceptedMaterials.map(([number, name, description]) => (
                  <ScrollReveal key={number}>
                    <article className="flex gap-4 rounded-2xl border border-emerald-950/5 bg-white p-5 sm:p-6">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-800">
                        {number}
                      </span>
                      <div>
                        <h3 className="font-semibold text-emerald-950">
                          {name}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {description}
                        </p>
                      </div>
                    </article>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </Container>
        </section>

        <section
          aria-labelledby="prices-title"
          className="bg-white py-20 sm:py-24"
          id="harga-sampah"
        >
          <Container>
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-16">
              <ScrollReveal>
                <p className="text-xs font-semibold tracking-[0.2em] text-emerald-700 uppercase">
                  Nilai setiap setoran
                </p>
                <h2
                  className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-emerald-950 sm:text-4xl"
                  id="prices-title"
                >
                  Harga sampah
                </h2>
                <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
                  Harga dapat berubah mengikuti jenis, kondisi material, dan
                  kebijakan pengelola.
                </p>
                <p className="mt-5 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
                  Harga ilustrasi — konfirmasi sebelum menyetor
                </p>
              </ScrollReveal>

              <ScrollReveal>
                <div className="overflow-hidden rounded-2xl border border-emerald-950/10">
                  <div className="grid grid-cols-[1fr_auto] gap-4 bg-emerald-950 px-5 py-4 text-xs font-semibold tracking-wide text-white/75 uppercase sm:px-6">
                    <span>Jenis material</span>
                    <span>Contoh harga / kg</span>
                  </div>
                  {samplePrices.map((item, index) => (
                    <div
                      className={`grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-5 sm:px-6 ${
                        index % 2 === 0 ? "bg-white" : "bg-[#fbfcf9]"
                      }`}
                      key={item.name}
                    >
                      <span className="text-sm font-medium text-slate-700">
                        {item.name}
                      </span>
                      <span className="text-sm font-semibold text-emerald-800">
                        {item.price}
                        <span className="ml-1 text-xs font-normal text-slate-500">
                          / kg
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-500">
                  Harga di atas adalah data contoh untuk tampilan dan bukan
                  penawaran resmi. Daftar ini disiapkan agar mudah diganti
                  dengan data jenis dan harga dari Supabase.
                </p>
              </ScrollReveal>
            </div>
          </Container>
        </section>

        <section
          aria-labelledby="steps-title"
          className="overflow-hidden bg-[#f4f3e8] py-20 sm:py-24"
          id="prosedur"
        >
          <Container>
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
              <ScrollReveal>
                <p className="text-xs font-semibold tracking-[0.2em] text-emerald-700 uppercase">
                  Empat langkah sederhana
                </p>
                <h2
                  className="mt-4 max-w-lg text-3xl leading-tight font-semibold tracking-[-0.035em] text-emerald-950 sm:text-4xl"
                  id="steps-title"
                >
                  Dari pilah hingga menjadi manfaat.
                </h2>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {steps.map(({ number, title, description, icon: Icon }) => (
                    <article
                      className="rounded-2xl border border-emerald-950/5 bg-white p-4 sm:p-5"
                      key={number}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-700">
                          {number}
                        </span>
                        <Icon
                          aria-hidden="true"
                          className="size-4 text-emerald-700"
                        />
                      </div>
                      <h3 className="mt-4 text-sm font-semibold text-emerald-950">
                        {title}
                      </h3>
                      <p className="mt-2 text-xs leading-5 text-slate-600">
                        {description}
                      </p>
                    </article>
                  ))}
                </div>
              </ScrollReveal>

              <ScrollReveal className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem]">
                <Image
                  alt="Petugas menimbang setoran sampah bersama warga"
                  className="object-cover"
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  src="/images/proses-penimbangan.jpg"
                />
              </ScrollReveal>
            </div>
          </Container>
        </section>

        <section
          aria-labelledby="impact-title"
          className="bg-white py-20 sm:py-24"
          id="dampak"
        >
          <Container className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <ScrollReveal className="relative order-2 aspect-[4/3] overflow-hidden rounded-[1.75rem] lg:order-1">
              <Image
                alt="Berbagai hasil kerajinan yang dibuat dari material daur ulang"
                className="object-cover"
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                src="/images/hasil-daur-ulang.jpg"
              />
            </ScrollReveal>
            <ScrollReveal className="order-1 lg:order-2">
              <p className="text-xs font-semibold tracking-[0.2em] text-emerald-700 uppercase">
                Dampak lingkungan
              </p>
              <h2
                className="mt-4 max-w-xl text-3xl leading-tight font-semibold tracking-[-0.035em] text-emerald-950 sm:text-4xl"
                id="impact-title"
              >
                Yang kita pilah hari ini, bisa berguna kembali esok.
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
                Memilah membantu material yang masih bermanfaat kembali ke
                proses daur ulang. Bersama, kita mengurangi sampah tercampur
                dan mendukung lingkungan yang lebih bersih.
              </p>
              <div className="mt-7 flex items-center gap-3 text-sm font-medium text-emerald-800">
                <span className="flex size-9 items-center justify-center rounded-full bg-emerald-50">
                  <Check aria-hidden="true" className="size-4" />
                </span>
                Setiap setoran adalah langkah nyata.
              </div>
            </ScrollReveal>
          </Container>
        </section>

        <section className="bg-emerald-950 py-16 text-white sm:py-20">
          <Container className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.2em] text-lime-200 uppercase">
                Mulai perubahanmu
              </p>
              <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-[-0.035em] sm:text-4xl">
                Satu langkah kecilmu berarti bagi bumi.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/65 sm:text-base">
                Hubungi pengelola untuk mengetahui cara bergabung dan jadwal
                setoran di wilayahmu.
              </p>
            </div>
            <Link
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-lime-200 px-6 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-lime-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              href="/register"
            >
              Daftar Menjadi Nasabah
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}
