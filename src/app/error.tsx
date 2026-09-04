"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Nothing sensitive reaches this boundary: the plaintext lives in component
    // state that is already gone by the time an error is rendered.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
      <div className="card p-8 text-center sm:p-12">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] text-danger">
          <TriangleAlert size={22} />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold text-ink">
          That did not go to plan
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-ink-soft">
          Something broke while rendering this page. Nothing was sent anywhere, and any
          secret you had typed stayed in this tab. Try again, and if it keeps happening a
          reload usually clears it.
        </p>
        <div className="mt-7 flex justify-center">
          <Button onClick={reset} variant="secondary">
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
