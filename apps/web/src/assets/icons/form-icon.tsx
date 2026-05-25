interface IconProps {
  size?: number;
  className?: string;
}

export function FormIcon({ size = 24, className }: IconProps) {
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
      <rect x="14" y="8" width="28" height="3.5" rx="2" fill="#8B5E27" fillOpacity="0.7" />

      {/* Field 1 label */}
      <rect x="14" y="38" width="22" height="3" rx="1.5" fill="#B8926A" fillOpacity="0.6" />
      {/* Field 1 input */}
      <rect x="14" y="44" width="92" height="11" rx="4" fill="white" stroke="#D9B98A" strokeWidth="1.2" />

      {/* Field 2 label */}
      <rect x="14" y="61" width="30" height="3" rx="1.5" fill="#B8926A" fillOpacity="0.6" />
      {/* Field 2 input */}
      <rect x="14" y="67" width="92" height="11" rx="4" fill="white" stroke="#D9B98A" strokeWidth="1.2" />

      {/* Textarea label */}
      <rect x="14" y="84" width="18" height="3" rx="1.5" fill="#B8926A" fillOpacity="0.6" />
      {/* Textarea */}
      <rect x="14" y="90" width="92" height="18" rx="4" fill="white" stroke="#D9B98A" strokeWidth="1.2" />
    </svg>
  );
}
