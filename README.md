# Bank Sampah Digital

Fondasi aplikasi web Bank Sampah Digital menggunakan Next.js App Router,
JavaScript, Tailwind CSS, React, dan Lucide React. Tahap ini hanya mencakup
halaman informasi, autentikasi Supabase, dan dashboard dasar berdasarkan role.

## Menjalankan proyek

Pastikan Node.js dan npm sudah terpasang, lalu jalankan dari folder proyek:

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser. Gunakan
`Ctrl+C` di terminal untuk menghentikan server.

## Konfigurasi Supabase

Tambahkan variabel berikut ke `.env.local` (gunakan URL proyek dan publishable/
anon key dari pengaturan Supabase; jangan gunakan atau bagikan service role key):

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
```

Login tersedia di `/login`. Setelah Supabase Auth memverifikasi email dan
password, aplikasi membaca `role` dari `public.profiles` berdasarkan ID sesi
pengguna. Role `admin`, `petugas`, dan `nasabah` masing-masing diarahkan ke
`/admin`, `/petugas`, dan `/nasabah`. Layout dashboard memeriksa ulang sesi
server dan role dari database pada setiap akses. Logout mengakhiri sesi
Supabase; cookie sesi dikelola oleh `@supabase/ssr`.

Untuk menguji, siapkan tiga akun melalui Supabase Auth Dashboard atau proses
administratif tepercaya yang sudah digunakan proyek, lalu pastikan baris
`public.profiles` untuk masing-masing ID memiliki role yang sesuai. Masuk dengan
setiap akun dan verifikasi rute tujuan. Saat satu akun sudah masuk, coba buka
dua rute role lain secara langsung; server harus mengarahkan akun ke dashboard
role-nya sendiri. Uji juga refresh halaman dan tombol Logout. Aplikasi ini
tidak menyediakan registrasi.

## Struktur utama

```text
src/
  app/                 Halaman, server actions, dashboard, dan stylesheet global
  components/
    layout/            Navbar dan Footer
    ui/                Komponen UI bersama: Button, Container, Loading, NotFound
    auth/              Form login, logout, dan pelindung role
    dashboard/         Tampilan dashboard role
  lib/
    supabase/          Supabase browser/server client yang digunakan bersama
    auth.js            Pemeriksaan sesi dan role server-side
public/                Aset statis
```
