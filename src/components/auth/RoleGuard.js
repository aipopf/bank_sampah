import { requireRole } from "@/lib/auth";
import DashboardHome from "@/components/dashboard/DashboardHome";
import NasabahDashboard from "@/components/dashboard/NasabahDashboard";
import PetugasDashboard from "@/components/dashboard/PetugasDashboard";
import { createClient } from "@/lib/supabase/server";

export default async function RoleGuard({ role }) {
  await requireRole(role);

  if (role === "admin") {
    return <DashboardHome role={role} />;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Gagal memuat sesi pengguna: ${userError.message}`);
  }

  if (!user) {
    throw new Error("Sesi pengguna tidak ditemukan setelah pemeriksaan akses.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, nama, saldo")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw new Error(`Gagal memuat profil: ${profileError.message}`);
  }

  if (role === "nasabah") {
    const [depositsResult, withdrawalsResult, wasteTypesResult] =
      await Promise.all([
        supabase
          .from("setoran")
          .select("id, tanggal_setoran, total_berat, total_harga, status")
          .eq("nasabah_id", user.id)
          .order("tanggal_setoran", { ascending: false })
          .limit(6),
        supabase
          .from("penarikan")
          .select("id, jumlah, tanggal_penarikan, status, status_pembayaran")
          .eq("nasabah_id", user.id)
          .order("tanggal_penarikan", { ascending: false })
          .limit(5),
        supabase
          .from("jenis_sampah")
          .select("id, nama_sampah, harga_per_kg, satuan")
          .eq("is_active", true)
          .order("nama_sampah"),
      ]);

    const failedResult = [
      depositsResult,
      withdrawalsResult,
      wasteTypesResult,
    ].find((result) => result.error);

    if (failedResult) {
      throw new Error(`Gagal memuat data dashboard: ${failedResult.error.message}`);
    }

    return (
      <NasabahDashboard
        profile={profile}
        deposits={depositsResult.data}
        withdrawals={withdrawalsResult.data}
        wasteTypes={wasteTypesResult.data}
      />
    );
  }

  const [customersResult, wasteTypesResult, depositsResult, withdrawalsResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, nama")
        .eq("role", "nasabah")
        .order("nama"),
      supabase
        .from("jenis_sampah")
        .select("id, nama_sampah, harga_per_kg, satuan")
        .eq("is_active", true)
        .order("nama_sampah"),
      supabase
        .from("setoran")
        .select("id, nasabah_id, tanggal_setoran, total_berat, total_harga, status")
        .eq("petugas_id", user.id)
        .order("tanggal_setoran", { ascending: false })
        .limit(8),
      supabase
        .from("penarikan")
        .select("id, nasabah_id, jumlah, tanggal_penarikan")
        .eq("status", "disetujui")
        .eq("status_pembayaran", "menunggu")
        .order("tanggal_penarikan", { ascending: true })
        .limit(8),
    ]);

  const failedResult = [
    customersResult,
    wasteTypesResult,
    depositsResult,
    withdrawalsResult,
  ].find((result) => result.error);

  if (failedResult) {
    throw new Error(`Gagal memuat data dashboard: ${failedResult.error.message}`);
  }

  const customerIds = [
    ...new Set(withdrawalsResult.data.map((withdrawal) => withdrawal.nasabah_id)),
  ];
  let withdrawalCustomers = [];

  if (customerIds.length > 0) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nama")
      .in("id", customerIds);

    if (error) {
      throw new Error(`Gagal memuat data nasabah: ${error.message}`);
    }

    withdrawalCustomers = data;
  }

  return (
    <PetugasDashboard
      profile={profile}
      customers={customersResult.data}
      wasteTypes={wasteTypesResult.data}
      deposits={depositsResult.data}
      withdrawals={withdrawalsResult.data}
      withdrawalCustomers={withdrawalCustomers}
    />
  );
}
