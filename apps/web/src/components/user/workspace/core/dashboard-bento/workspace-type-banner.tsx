import { Lock, Users2, ArrowRight } from "lucide-react";

export function WorkspaceTypeBanner({
  isPersonal,
  isPrivate,
  onCreatePublic,
}: {
  isPersonal: boolean;
  isPrivate: boolean;
  onCreatePublic: () => void;
}) {
  if (!isPersonal && !isPrivate) return null;

  const label = isPersonal ? "Personal workspace" : "Private workspace";
  const Icon = isPersonal ? Lock : Users2;

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 12,
      borderRadius: 12, border: "1px solid #FCD34D",
      background: "#FFFBEB", padding: "12px 16px", marginBottom: 20,
    }}>
      <div style={{
        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        width: 32, height: 32, borderRadius: 8, background: "#FDE68A", marginTop: 2,
      }}>
        <Icon size={16} color="#92400E" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#78350F", marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 12, color: "#B45309", lineHeight: 1.5 }}>
          {isPersonal
            ? "This is your personal workspace — it can't be shared or upgraded to a paid plan."
            : "Private workspaces can't be upgraded to Pro or invite team members."}{" "}
          To collaborate with your team or unlock Pro features, create a public workspace.
        </p>
      </div>
      <button
        type="button"
        onClick={onCreatePublic}
        style={{
          flexShrink: 0, display: "flex", alignItems: "center", gap: 4,
          fontSize: 12, fontWeight: 700, color: "#92400E",
          background: "none", border: "none", cursor: "pointer",
          whiteSpace: "nowrap", marginTop: 2,
        }}
      >
        Create public workspace <ArrowRight size={13} />
      </button>
    </div>
  );
}
