export function UpgradeButton({
  planId,
  onClick,
}: {
  planId?: string;
  onClick?: () => void;
}) {
  return (
    <>
      <style>{`
        @keyframes aurora {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .ws-badge-promax {
          background: linear-gradient(135deg, #C4956A, #F5D08A, #FBBF24, #E8A87C, #D97706, #C4956A);
          background-size: 300% 300%;
          animation: aurora 7s ease infinite;
        }
        @keyframes pro-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(5,150,105,0.55); }
          50%       { box-shadow: 0 0 0 8px rgba(5,150,105,0); }
        }
        .ws-badge-pro {
          background: linear-gradient(135deg, #059669, #0D9488);
          animation: pro-pulse 3.5s ease-in-out infinite;
        }
        @keyframes shimmer-sweep {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .ws-badge-free {
          background: linear-gradient(90deg, #1C1610 35%, #7A6A5A 50%, #1C1610 65%);
          background-size: 200% auto;
          animation: shimmer-sweep 5s linear infinite;
        }
      `}</style>

      {planId === "PRO_MAX" ? (
        <div className="ws-badge-promax" style={{
          fontSize: 11, fontWeight: 800, color: "#1C1610", borderRadius: 999,
          padding: "9px 20px", letterSpacing: "0.08em", textTransform: "uppercase",
          userSelect: "none", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ fontSize: 13 }}>✦</span> Pro Max
        </div>
      ) : planId === "PRO" ? (
        <button onClick={onClick} className="ws-badge-pro" style={{
          color: "white", border: "none", borderRadius: 999, padding: "9px 20px",
          fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
          letterSpacing: "0.04em", textTransform: "uppercase",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ fontSize: 12 }}>◈</span> Pro
        </button>
      ) : (
        <button onClick={onClick} className="ws-badge-free" style={{
          color: "white", border: "none", borderRadius: 999,
          padding: "9px 22px", fontSize: 13, fontWeight: 700,
          cursor: "pointer", whiteSpace: "nowrap",
        }}>
          Upgrade
        </button>
      )}
    </>
  );
}
