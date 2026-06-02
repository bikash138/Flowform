import { Users2 } from "lucide-react";

const ROLE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  owner:  { bg: "#C4956A18", text: "#C4956A", border: "#C4956A60" },
  admin:  { bg: "#F59E0B18", text: "#B45309", border: "#F59E0B60" },
  editor: { bg: "#60A5FA18", text: "#2563EB", border: "#60A5FA60" },
  viewer: { bg: "#A78BFA18", text: "#7C3AED", border: "#A78BFA60" },
};

type Member = {
  userId: string;
  role: string;
  user?: { name?: string | null; image?: string | null } | null;
};

export function TeamMembersCard({
  members,
  memberUsage,
  onInviteClick,
}: {
  members: Member[];
  memberUsage?: { limit: number | null } | null;
  onInviteClick: () => void;
}) {
  return (
    <div
      className="ws-right-col-2"
      style={{
        gridColumn: 2, gridRow: 2,
        background: "white", borderRadius: 24, padding: "14px 20px",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 14, flexShrink: 0,
      }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1C1610", marginBottom: 1 }}>Team Members</p>
          <p style={{ fontSize: 10, color: "#B3A89E" }}>
            {members.length} of {memberUsage?.limit ?? 10} seats used
          </p>
        </div>
        <button
          onClick={onInviteClick}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "#1C1610", border: "none", borderRadius: 999,
            padding: "6px 14px", cursor: "pointer", flexShrink: 0,
          }}
        >
          <Users2 size={11} color="white" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>Invite</span>
        </button>
      </div>

      <div style={{ overflowX: "auto", overflowY: "hidden", display: "flex", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 20, paddingBottom: 4 }}>
          {members.map((member) => {
            const roleKey = member.role.toLowerCase();
            const rs = ROLE_STYLE[roleKey] ?? ROLE_STYLE.viewer;
            const name = member.user?.name || "Unknown";
            const memberFirstName = name.split(" ")[0];
            const initial = name.charAt(0).toUpperCase();
            return (
              <div key={member.userId} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <div style={{ position: "relative" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: rs.bg, border: `2px solid ${rs.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                  }}>
                    {member.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.user.image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 13, fontWeight: 800, color: rs.text }}>{initial}</span>
                    )}
                  </div>
                  <div style={{
                    position: "absolute", top: -5, left: -5,
                    background: rs.text, color: "white",
                    fontSize: 7, fontWeight: 800, borderRadius: 99,
                    padding: "2px 5px", textTransform: "capitalize",
                    whiteSpace: "nowrap", boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                    letterSpacing: "0.02em",
                  }}>
                    {roleKey}
                  </div>
                </div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#1C1610", whiteSpace: "nowrap" }}>
                  {memberFirstName}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
