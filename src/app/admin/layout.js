import { Suspense } from "react";
import Loading from "@/components/ui/Loading";

export default function AdminLayout({ children }) {
  return (
    <Suspense fallback={<Loading label="Memuat dashboard administrator..." />}>
      {children}
    </Suspense>
  );
}
