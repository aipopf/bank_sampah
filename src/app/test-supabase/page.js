"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CircleDashed,
  Database,
  KeyRound,
  Link2,
  Server,
  Table2,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/supabase/config";

const initialStatus = {
  client: { status: "checking", message: "Menyiapkan Supabase client..." },
  api: { status: "checking", message: "Memeriksa REST API melalui Supabase SDK..." },
  table: { status: "info", message: "Menunggu hasil pemeriksaan tabel profiles." },
  credentials: { status: "info", message: "Menunggu respons dari Supabase." },
  network: { status: "checking", message: "Memeriksa koneksi jaringan..." },
};

function isNetworkError(error) {
  return (
    error?.status === 0 ||
    error?.name === "TypeError" ||
    /network|fetch failed|failed to fetch/i.test(error?.message ?? "")
  );
}

function isCredentialError(error) {
  return (
    error?.status === 401 ||
    ["PGRST301", "invalid_api_key"].includes(error?.code) ||
    /invalid api key|invalid jwt|jwt.*(expired|invalid)/i.test(
      error?.message ?? "",
    )
  );
}

function StatusCard({ icon: Icon, title, status, message }) {
  const statusStyles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-rose-200 bg-rose-50 text-rose-800",
    checking: "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-slate-200 bg-white text-slate-700",
  };
  const StatusIcon =
    status === "success"
      ? CheckCircle2
      : status === "error"
        ? XCircle
        : status === "checking"
          ? CircleDashed
          : CircleDashed;

  return (
    <article
      className={`rounded-2xl border p-5 shadow-sm ${statusStyles[status]}`}
    >
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/80">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm leading-6">{message}</p>
        </div>
        <StatusIcon
          aria-hidden="true"
          className={`size-5 shrink-0 ${status === "checking" ? "animate-spin" : ""}`}
        />
      </div>
    </article>
  );
}

export default function TestSupabasePage() {
  const configured = hasSupabaseConfig();
  const urlConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKeyConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const [statuses, setStatuses] = useState(() =>
    configured
      ? initialStatus
      : {
          client: { status: "error", message: "Konfigurasi belum lengkap." },
          api: { status: "info", message: "REST API belum diperiksa." },
          table: { status: "info", message: "Tabel belum diperiksa." },
          credentials: {
            status: "info",
            message: "Kredensial belum dapat diverifikasi.",
          },
          network: {
            status: "info",
            message: "Koneksi jaringan belum diperiksa.",
          },
        },
  );

  useEffect(() => {
    if (!configured) {
      return;
    }

    let active = true;

    async function checkSupabase() {
      let supabase;

      try {
        supabase = createClient();
        if (active) {
          setStatuses((current) => ({
            ...current,
            client: {
              status: "success",
              message: "Supabase browser client berhasil diinisialisasi.",
            },
          }));
        }
      } catch {
        if (active) {
          setStatuses((current) => ({
            ...current,
            client: {
              status: "error",
              message: "Supabase client tidak dapat diinisialisasi.",
            },
            api: {
              status: "info",
              message: "REST API belum diperiksa.",
            },
            credentials: {
              status: "info",
              message: "Kredensial belum dapat diverifikasi.",
            },
            network: {
              status: "info",
              message: "Koneksi jaringan belum diperiksa.",
            },
          }));
        }
        return;
      }

      try {
        const { error } = await supabase
          .from("profiles")
          .select("*", { head: true })
          .limit(0);

        if (!active) {
          return;
        }

        if (!error) {
          setStatuses((current) => ({
            ...current,
            api: {
              status: "success",
              message: "REST API berhasil diakses melalui Supabase SDK.",
            },
            table: {
              status: "success",
              message: "Query ringan ke tabel profiles berhasil.",
            },
            credentials: {
              status: "success",
              message: "Kredensial diterima oleh REST API.",
            },
            network: {
              status: "success",
              message: "Supabase merespons permintaan.",
            },
          }));
          return;
        }

        if (error.code === "PGRST205") {
          setStatuses((current) => ({
            ...current,
            api: {
              status: "success",
              message: "REST API tersedia dan merespons melalui Supabase SDK.",
            },
            table: {
              status: "info",
              message:
                "Koneksi API tersedia, tetapi tabel belum dibuat atau belum ditemukan.",
            },
            credentials: {
              status: "success",
              message: "Kredensial diterima oleh REST API.",
            },
            network: {
              status: "success",
              message: "Supabase merespons permintaan.",
            },
          }));
          return;
        }

        if (isNetworkError(error)) {
          setStatuses((current) => ({
            ...current,
            api: {
              status: "error",
              message: "REST API tidak dapat dijangkau melalui jaringan.",
            },
            table: {
              status: "info",
              message: "Akses query tabel belum dapat diverifikasi.",
            },
            credentials: {
              status: "info",
              message: "Kredensial belum dapat diverifikasi.",
            },
            network: {
              status: "error",
              message:
                "Permintaan gagal karena masalah jaringan atau koneksi ke Supabase.",
            },
          }));
          return;
        }

        if (isCredentialError(error)) {
          setStatuses((current) => ({
            ...current,
            api: {
              status: "success",
              message: "REST API merespons permintaan.",
            },
            table: {
              status: "info",
              message: "Akses query tabel belum dapat diverifikasi.",
            },
            credentials: {
              status: "error",
              message: "REST API menolak kredensial yang dikirim.",
            },
            network: {
              status: "success",
              message: "Supabase merespons permintaan.",
            },
          }));
          return;
        }

        setStatuses((current) => ({
          ...current,
          api: {
            status: "success",
            message: "REST API merespons permintaan.",
          },
          table: {
            status: "info",
            message:
              "Koneksi dasar tersedia, tetapi akses query tabel belum dapat diverifikasi.",
          },
          credentials: {
            status: "info",
            message:
              "Respons API tidak cukup untuk menyatakan kredensial tidak valid.",
          },
          network: {
            status: "success",
            message: "Supabase merespons permintaan.",
          },
        }));
      } catch (error) {
        if (!active) {
          return;
        }

        if (isNetworkError(error)) {
          setStatuses((current) => ({
            ...current,
            api: {
              status: "error",
              message: "REST API tidak dapat dijangkau melalui jaringan.",
            },
            table: {
              status: "info",
              message: "Akses query tabel belum dapat diverifikasi.",
            },
            credentials: {
              status: "info",
              message: "Kredensial belum dapat diverifikasi.",
            },
            network: {
              status: "error",
              message:
                "Permintaan gagal karena masalah jaringan atau koneksi ke Supabase.",
            },
          }));
          return;
        }

        setStatuses((current) => ({
          ...current,
          api: {
            status: "error",
            message: "Pemeriksaan REST API gagal.",
          },
          table: {
            status: "info",
            message: "Akses query tabel belum dapat diverifikasi.",
          },
          credentials: {
            status: "info",
            message: "Kredensial belum dapat diverifikasi.",
          },
          network: {
            status: "info",
            message: "Penyebab respons belum dapat diklasifikasikan.",
          },
        }));
      }
    }

    checkSupabase();

    return () => {
      active = false;
    };
  }, [configured]);

  return (
    <main className="min-h-screen bg-[#F5F6F7] px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-sm font-semibold tracking-wide text-[#228B55]">
            BANK SAMPAH DIGITAL
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Tes koneksi Supabase
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Halaman ini memeriksa konfigurasi, inisialisasi client, dan
            ketersediaan API Supabase tanpa menampilkan API key.
          </p>
        </header>

        <section aria-label="Status konfigurasi" className="grid gap-4 sm:grid-cols-2">
          <StatusCard
            icon={Link2}
            title="URL Supabase"
            status={urlConfigured ? "success" : "error"}
            message={urlConfigured ? "URL sudah diatur." : "URL belum diisi di .env.local."}
          />
          <StatusCard
            icon={KeyRound}
            title="Anon key"
            status={anonKeyConfigured ? "success" : "error"}
            message={
              anonKeyConfigured
                ? "Anon key sudah diatur dan tidak ditampilkan."
                : "Anon key belum diisi di .env.local."
            }
          />
          <StatusCard
            icon={Database}
            title="Inisialisasi client"
            {...statuses.client}
          />
          <StatusCard
            icon={Server}
            title="Koneksi API Supabase"
            {...statuses.api}
          />
          <div className="sm:col-span-2">
            <StatusCard
              icon={Table2}
              title="Tabel profiles"
              {...statuses.table}
            />
          </div>
          <StatusCard
            icon={KeyRound}
            title="Kredensial API"
            {...statuses.credentials}
          />
          <StatusCard
            icon={Server}
            title="Koneksi jaringan"
            {...statuses.network}
          />
        </section>

        <p className="mt-6 text-sm leading-6 text-slate-500">
          Gunakan anon key untuk akses publik yang dibatasi kebijakan keamanan.
          Jangan letakkan service_role key atau secret key di browser.
        </p>
      </div>
    </main>
  );
}
