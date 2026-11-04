import { Suspense } from "react";
import RoleGuard from "@/components/auth/RoleGuard";
import Loading from "@/components/ui/Loading";

export default function AdminPage() {
  return (
    <Suspense fallback={<Loading label="Memeriksa akses administrator..." />}>
      <RoleGuard role="admin" />
    </Suspense>
  );
}
