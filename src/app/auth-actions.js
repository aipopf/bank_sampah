"use server";

import { redirect } from "next/navigation";
import { getDashboardPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function loginAction(_previousState, formData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!emailPattern.test(email)) {
    return { error: "Masukkan alamat email yang valid." };
  }

  if (!password) {
    return { error: "Password wajib diisi." };
  }

  const supabase = await createClient();
  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !data.user) {
    return { error: "Email atau password salah. Silakan coba lagi." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  const dashboardPath = profileError ? null : getDashboardPath(profile?.role);

  if (!dashboardPath) {
    const { error: signOutError } = await supabase.auth.signOut();

    if (profileError) {
      console.error("Gagal membaca role profil setelah login.", profileError);
    }

    if (signOutError) {
      console.error("Gagal mengakhiri sesi dengan profil tidak valid.", signOutError);
    }

    return {
      error: profileError
        ? "Profil akun tidak dapat diverifikasi. Silakan coba lagi nanti."
        : "Akun belum memiliki role yang valid. Hubungi administrator.",
    };
  }

  redirect(dashboardPath);
}

export async function signUpAction(_previousState, formData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirmation = String(
    formData.get("passwordConfirmation") ?? "",
  );

  if (!name || name.length > 100) {
    return { error: "Nama wajib diisi dan maksimal 100 karakter." };
  }

  if (!emailPattern.test(email) || email.length > 255) {
    return { error: "Masukkan alamat email yang valid." };
  }

  if (!password) {
    return { error: "Password wajib diisi." };
  }

  if (password !== passwordConfirmation) {
    return { error: "Konfirmasi password tidak cocok." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nama: name },
    },
  });

  if (error) {
    console.error("Gagal mendaftarkan akun nasabah.", error);
    return {
      error:
        error.code === "weak_password"
          ? `Password belum memenuhi ketentuan: ${error.message}`
          : "Pendaftaran gagal. Periksa data Anda dan coba lagi.",
    };
  }

  if (!data.user) {
    console.error("Pendaftaran akun tidak menghasilkan data pengguna.");
    return { error: "Pendaftaran gagal. Silakan coba lagi nanti." };
  }

  if (data.session) {
    redirect("/nasabah");
  }

  return {
    success:
      "Jika alamat email dapat didaftarkan, tautan konfirmasi akan dikirim. Periksa kotak masuk email Anda.",
  };
}

export async function logoutAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Gagal mengakhiri sesi Supabase.", error);
    return { error: "Logout gagal. Silakan coba lagi." };
  }

  redirect("/login");
}
