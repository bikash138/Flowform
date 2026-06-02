export function RadialGauge({
  value,
  max,
  display,
  description,
  color,
}: {
  value: number;
  max: number;
  display: string;
  description: string;
  color: string;
}) {
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const cx = 56, cy = 52, r = 36, sw = 10;
  const START = 220, END = -40, TOTAL = START - END; // 260°

  function pt(deg: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  }

  function arc(from: number, to: number) {
    const s = pt(from), e = pt(to);
    const span = from - to;
    if (span < 0.5) return "";
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${span > 180 ? 1 : 0} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  }

  const filledEnd = START - pct * TOTAL;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={112} height={96}>
        <path d={arc(START, END)} fill="none" stroke="#F0EBE4" strokeWidth={sw} strokeLinecap="round" />
        {pct > 0.005 && (
          <path d={arc(START, filledEnd)} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        )}
        <text
          x={cx} y={cy + 4}
          textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: 13, fontWeight: 800, fill: "#1C1610", fontFamily: "inherit" }}
        >
          {display}
        </text>
      </svg>
      <p style={{ fontSize: 10, fontWeight: 600, color: "#9E8E7E", textAlign: "center", marginTop: 2, lineHeight: 1.3 }}>
        {description}
      </p>
    </div>
  );
}
