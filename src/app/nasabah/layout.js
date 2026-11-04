import { Suspense } from "react";
import Loading from "@/components/ui/Loading";

export default function NasabahLayout({ children }) {
  return (
    <Suspense fallback={<Loading label="Memuat dashboard nasabah..." />}>
      {children}
    </Suspense>
  );
}
