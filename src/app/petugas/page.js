import { Suspense } from "react";
import RoleGuard from "@/components/auth/RoleGuard";
import Loading from "@/components/ui/Loading";

export default function PetugasPage() {
  return (
    <Suspense fallback={<Loading label="Memeriksa akses petugas..." />}>
      <RoleGuard role="petugas" />
    </Suspense>
  );
}
