type MarkProps = {
  size?: number;
  className?: string;
  /** Unique per instance so two marks on one page do not share gradient ids. */
  idSuffix?: string;
};

export function CredoMark({ size = 28, className, idSuffix = "a" }: MarkProps) {
  const grad = `credo-grad-${idSuffix}`;
  const sheen = `credo-sheen-${idSuffix}`;
  const mask = `credo-mask-${idSuffix}`;
  const shield =
    "M16 1.2 29.6 6.2V16.6C29.6 24 23.9 29.5 16 31.6 8.1 29.5 2.4 24 2.4 16.6V6.2Z";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={grad} x1="3" y1="1" x2="29" y2="31" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3BE8B0" />
          <stop offset="0.55" stopColor="#12C58C" />
          <stop offset="1" stopColor="#7C74FF" />
        </linearGradient>
        <linearGradient id={sheen} x1="4" y1="3" x2="18" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.38" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={mask}>
          <rect width="32" height="32" fill="#000" />
          <path d={shield} fill="#fff" />
          <circle cx="16" cy="14.2" r="3.4" fill="#000" />
          <path
            d="M13.75 16.6 12.6 23.6A1 1 0 0 0 13.6 24.7H18.4A1 1 0 0 0 19.4 23.6L18.25 16.6Z"
            fill="#000"
          />
        </mask>
      </defs>
      <g mask={`url(#${mask})`}>
        <path d={shield} fill={`url(#${grad})`} />
        <path d={shield} fill={`url(#${sheen})`} />
      </g>
    </svg>
  );
}

export function Wordmark({
  size = 28,
  showTagline = false,
  idSuffix = "a",
}: {
  size?: number;
  showTagline?: boolean;
  idSuffix?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <CredoMark size={size} idSuffix={idSuffix} />
      <span className="flex flex-col leading-none">
        <span
          className="font-display font-bold tracking-tight text-ink"
          style={{ fontSize: size * 0.72 }}
        >
          Credo
        </span>
        {showTagline ? (
          <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.18em] text-brand">
            Zero knowledge sharing
          </span>
        ) : null}
      </span>
    </span>
  );
}
