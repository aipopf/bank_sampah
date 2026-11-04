import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "./supabase/server";

const dashboardPaths = {
  admin: "/admin",
  petugas: "/petugas",
  nasabah: "/nasabah",
};

export function getDashboardPath(role) {
  return dashboardPaths[role] ?? null;
}

export async function getAuthenticatedRole() {
  await connection();

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { role: null, error: userError };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { role: null, error: profileError };
  }

  return { role: profile?.role ?? null, error: null };
}

export async function requireRole(expectedRole) {
  const { role, error } = await getAuthenticatedRole();
  const dashboardPath = getDashboardPath(role);

  if (error || !dashboardPath) {
    redirect("/login");
  }

  if (role !== expectedRole) {
    redirect(dashboardPath);
  }
}
