import { Suspense } from "react";
import Loading from "@/components/ui/Loading";

export default function PetugasLayout({ children }) {
  return (
    <Suspense fallback={<Loading label="Memuat dashboard petugas..." />}>
      {children}
    </Suspense>
  );
}
