import { requireRole } from "@/lib/auth";
import DashboardHome from "@/components/dashboard/DashboardHome";

export default async function RoleGuard({ role }) {
  await requireRole(role);
  return <DashboardHome role={role} />;
}
