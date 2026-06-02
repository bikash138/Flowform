export function BlobChart({
  totalViews,
  totalForms,
  submitted,
}: {
  totalViews: number;
  totalForms: number;
  submitted: number;
}) {
  return (
    <div style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: 160 }}>
      {/* Black blob — total forms (standalone, left) */}
      <div style={{
        position: "absolute", width: 110, height: 110, borderRadius: "50%",
        background: "radial-gradient(circle at 38% 35%, #4A4038, #1C1814)",
        top: "44%", left: "19%", transform: "translate(-50%, -50%)",
        filter: "blur(2px)", opacity: 0.96,
      }} />
      {/* Yellow blob — total views (large, right) */}
      <div style={{
        position: "absolute", width: 235, height: 235, borderRadius: "50%",
        background: "radial-gradient(circle at 42% 38%, #F5C842, #D9A020)",
        top: "42%", left: "60%", transform: "translate(-50%, -50%)",
        filter: "blur(3px)", opacity: 0.9,
      }} />
      {/* Red blob — submitted (overlaps yellow to show subset relationship) */}
      <div style={{
        position: "absolute", width: 165, height: 165, borderRadius: "50%",
        background: "radial-gradient(circle at 40% 38%, #F07060, #D94030)",
        top: "58%", left: "47%", transform: "translate(-50%, -50%)",
        filter: "blur(3px)", opacity: 0.88,
      }} />

      {/* Labels */}
      <div style={{ position: "absolute", top: "44%", left: "19%", transform: "translate(-50%, -50%)", textAlign: "center", zIndex: 10 }}>
        <p style={{ fontSize: 22, fontWeight: 800, color: "white", lineHeight: 1, margin: 0 }}>{totalForms}</p>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", marginTop: 3 }}>total forms</p>
      </div>
      <div style={{ position: "absolute", top: "28%", left: "65%", transform: "translate(-50%, -50%)", textAlign: "center", zIndex: 10 }}>
        <p style={{ fontSize: 28, fontWeight: 800, color: "#1C1610", lineHeight: 1, margin: 0 }}>{totalViews}</p>
        <p style={{ fontSize: 10, color: "rgba(28,22,16,0.6)", marginTop: 3 }}>total views</p>
      </div>
      <div style={{ position: "absolute", top: "62%", left: "46%", transform: "translate(-50%, -50%)", textAlign: "center", zIndex: 10 }}>
        <p style={{ fontSize: 22, fontWeight: 800, color: "white", lineHeight: 1, margin: 0 }}>{submitted}</p>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", marginTop: 3 }}>submitted</p>
      </div>
    </div>
  );
}
