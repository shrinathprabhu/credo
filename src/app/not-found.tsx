import { Compass } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { Shell } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Page not found",
  // Without this the root layout's index directive is emitted alongside the
  // noindex Next adds for a 404, which is two answers to the same question.
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <Shell narrow>
      <div className="card p-8 text-center sm:p-12">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-surface-2 text-ink-faint">
          <Compass size={22} />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold text-ink">
          There is nothing at this address
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-ink-soft">
          If you followed a share link and landed here, the id was probably mistyped or a
          character got lost when it was pasted. Try opening it by id instead.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/open">Open by id</ButtonLink>
          <ButtonLink href="/" variant="secondary">
            Back to the start
          </ButtonLink>
        </div>
      </div>
    </Shell>
  );
}
