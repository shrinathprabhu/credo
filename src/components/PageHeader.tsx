import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-8">
      {eyebrow ? (
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-2.5 text-3xl font-bold text-ink sm:text-4xl">{title}</h1>
      {lead ? (
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{lead}</p>
      ) : null}
      {children}
    </header>
  );
}

export function Shell({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-64" aria-hidden />
      <div
        className={`relative mx-auto w-full px-4 pt-12 pb-8 sm:px-6 ${
          narrow ? "max-w-2xl" : "max-w-3xl"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
