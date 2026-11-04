import { Suspense } from "react";
import RoleGuard from "@/components/auth/RoleGuard";
import Loading from "@/components/ui/Loading";

export default function NasabahPage() {
  return (
    <Suspense fallback={<Loading label="Memeriksa akses nasabah..." />}>
      <RoleGuard role="nasabah" />
    </Suspense>
  );
}
