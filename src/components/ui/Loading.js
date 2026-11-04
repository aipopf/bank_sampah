import { LoaderCircle } from "lucide-react";

export default function Loading({ label = "Memuat..." }) {
  return (
    <div
      className="flex items-center justify-center gap-3 py-12 text-sm font-medium text-emerald-900"
      role="status"
    >
      <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}
