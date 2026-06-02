import { RadialGauge } from "./radial-gauge";

export function UsageLimitsCard({
  quota,
  formUsage,
  memberUsage,
  planId,
  onUpgradeClick,
}: {
  quota?: { usedThisMonth: number; monthlyLimit: number } | null;
  formUsage?: { used: number; limit: number | null } | null;
  memberUsage?: { used: number; limit: number | null } | null;
  planId?: string;
  onUpgradeClick: () => void;
}) {
  const responsePercent = quota ? (quota.usedThisMonth / quota.monthlyLimit) * 100 : 0;
  const responseDisplay = quota
    ? `${((quota.usedThisMonth / quota.monthlyLimit) * 100).toFixed(1)}%`
    : "0%";

  return (
    <div
      className="ws-right-col-3"
      style={{
        gridColumn: 2, gridRow: 3,
        background: "white", borderRadius: 24, padding: "18px 24px",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}
    >
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBottom: 14, flexShrink: 0,
      }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#1C1610", marginBottom: 1 }}>Usage &amp; Limits</p>
          <p style={{ fontSize: 11, color: "#B3A89E" }}>Your plan usage at a glance</p>
        </div>
        {planId !== "PRO_MAX" && (
          <button
            onClick={onUpgradeClick}
            style={{
              fontSize: 11, color: "#C4956A", fontWeight: 700,
              background: "rgba(196,149,106,0.1)", border: "none",
              borderRadius: 999, padding: "5px 14px", cursor: "pointer",
            }}
          >
            Upgrade
          </button>
        )}
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center" }}>
        <RadialGauge
          value={responsePercent}
          max={100}
          display={responseDisplay}
          description={`of ${quota?.monthlyLimit.toLocaleString() ?? "—"} responses`}
          color="#C4956A"
        />
        <div style={{
          borderLeft: "1px solid #F0EBE4", borderRight: "1px solid #F0EBE4",
          height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <RadialGauge
            value={formUsage?.used ?? 0}
            max={formUsage?.limit ?? 50}
            display={`${formUsage?.used ?? 0}`}
            description={`of ${formUsage?.limit ?? "—"} forms`}
            color="#22C55E"
          />
        </div>
        <RadialGauge
          value={memberUsage?.used ?? 0}
          max={memberUsage?.limit ?? 10}
          display={`${memberUsage?.used ?? 0}`}
          description={`of ${memberUsage?.limit ?? "—"} members`}
          color="#60A5FA"
        />
      </div>
    </div>
  );
}
