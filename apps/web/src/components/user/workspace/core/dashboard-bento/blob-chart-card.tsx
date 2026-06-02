import { BarChart2 } from "lucide-react";
import { BlobChart } from "./blob-chart";

export function BlobChartCard({
  totalViews,
  totalForms,
  submitted,
}: {
  totalViews: number;
  totalForms: number;
  submitted: number;
}) {
  return (
    <div
      className="ws-right-col-1"
      style={{
        gridColumn: 2, gridRow: 1,
        background: "#D8D2C6", borderRadius: 24, padding: "18px 24px",
        position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}
    >
      <div style={{ position: "absolute", top: 18, right: 18 }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: "rgba(28,22,16,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <BarChart2 size={14} color="#5C4E40" />
        </div>
      </div>

      <p style={{ fontSize: 16, fontWeight: 700, color: "#3C3428", marginBottom: 2 }}>
        Your Form Results for Today
      </p>
      <p style={{ fontSize: 11, color: "#7A6E62", marginBottom: 8 }}>
        Responses across all active forms
      </p>

      <BlobChart totalViews={totalViews} totalForms={totalForms} submitted={submitted} />

      <div className="ws-blob-legend" style={{ display: "flex", gap: 18, paddingTop: 10, flexShrink: 0 }}>
        {[
          { color: "#D9A020", label: "Total Views" },
          { color: "#D94030", label: "Submitted" },
          { color: "#1C1814", label: "Total Forms" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#6B5E52", fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
