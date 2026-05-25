interface IconProps {
  size?: number;
  className?: string;
}

export function PollIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer card */}
      <rect width="120" height="120" rx="16" fill="#EDD9B8" stroke="#C9954A" strokeWidth="2" />

      {/* Header accent bar */}
      <rect x="0" y="0" width="120" height="28" rx="16" fill="#C9954A" fillOpacity="0.18" />
      <rect x="0" y="14" width="120" height="14" fill="#C9954A" fillOpacity="0.18" />

      {/* Header label line */}
      <rect x="14" y="8" width="22" height="3.5" rx="2" fill="#8B5E27" fillOpacity="0.7" />

      {/* Option 1 — selected, longest bar */}
      <circle cx="22" cy="46" r="5.5" stroke="#C9954A" strokeWidth="1.8" />
      <circle cx="22" cy="46" r="2.8" fill="#C9954A" />
      <rect x="34" y="41" width="72" height="10" rx="3" fill="#EDE0CC" />
      <rect x="34" y="41" width="60" height="10" rx="3" fill="#C9954A" fillOpacity="0.85" />

      {/* Option 2 */}
      <circle cx="22" cy="65" r="5.5" stroke="#C9954A" strokeWidth="1.8" />
      <rect x="34" y="60" width="72" height="10" rx="3" fill="#EDE0CC" />
      <rect x="34" y="60" width="38" height="10" rx="3" fill="#C9954A" fillOpacity="0.5" />

      {/* Option 3 */}
      <circle cx="22" cy="84" r="5.5" stroke="#C9954A" strokeWidth="1.8" />
      <rect x="34" y="79" width="72" height="10" rx="3" fill="#EDE0CC" />
      <rect x="34" y="79" width="20" height="10" rx="3" fill="#C9954A" fillOpacity="0.3" />

      {/* Divider */}
      <line x1="14" y1="102" x2="106" y2="102" stroke="#E5D5BE" strokeWidth="1" />

      {/* Footer lines */}
      <rect x="14" y="108" width="40" height="3.5" rx="2" fill="#D9B98A" fillOpacity="0.5" />
      <rect x="72" y="108" width="34" height="3.5" rx="2" fill="#D9B98A" fillOpacity="0.3" />
    </svg>
  );
}
