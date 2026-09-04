import { ChevronDown } from "lucide-react";
import type { FaqEntry } from "@/lib/schema";

/**
 * Plain details elements so the answers are in the HTML for crawlers and
 * assistants even before any JavaScript runs.
 */
export function FaqList({ entries }: { entries: FaqEntry[] }) {
  return (
    <div className="divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-[var(--line)] bg-surface">
      {entries.map((entry) => (
        <details key={entry.question} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-medium text-ink transition-colors hover:bg-surface-2">
            <h3 className="font-sans text-[15px] font-medium">{entry.question}</h3>
            <ChevronDown
              size={17}
              className="shrink-0 text-ink-faint transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <div className="px-5 pb-5 text-[14px] leading-relaxed text-ink-soft">
            {entry.answer}
          </div>
        </details>
      ))}
    </div>
  );
}
