"use client";

import { useActionState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
import { logoutAction } from "@/app/auth-actions";

export default function LogoutButton() {
  const [state, formAction, pending] = useActionState(logoutAction, null);

  return (
    <div>
      <form action={formAction}>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-emerald-900/15 bg-white px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={pending}
          type="submit"
        >
          {pending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <LogOut aria-hidden="true" className="size-4" />
          )}
          {pending ? "Keluar..." : "Logout"}
        </button>
      </form>
      {state?.error ? (
        <p aria-live="polite" className="mt-2 text-right text-xs text-rose-700" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
