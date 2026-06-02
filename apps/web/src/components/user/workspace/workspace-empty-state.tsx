"use client";

import { useState } from "react";
import { Lock, Users, ArrowRight, FileText } from "lucide-react";
import { CreateFormModal } from "@/components/modals/create-form-modal";

const s = {
  container: {
    flex: 1, display: "flex", flexDirection: "column" as const,
    alignItems: "center", justifyContent: "center",
    padding: "48px 24px", gap: 28,
  },
  iconBox: {
    width: 72, height: 72, borderRadius: 22,
    background: "rgba(196,149,106,0.14)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 12px rgba(196,149,106,0.12)",
  },
  textBlock: { textAlign: "center" as const, maxWidth: 400 },
  title: { fontSize: 19, fontWeight: 700, color: "#1C1610", marginBottom: 10, letterSpacing: "-0.01em" },
  subtitle: { fontSize: 13, color: "#8C7B6E", lineHeight: 1.7, margin: 0 },
  ctaStack: { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 10, width: "100%", maxWidth: 300 },
  primaryBtn: {
    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    background: "#1C1610", color: "white", border: "none", borderRadius: 999,
    padding: "13px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer",
    boxShadow: "0 4px 14px rgba(28,22,16,0.18)",
  },
  dividerRow: { display: "flex", alignItems: "center", gap: 10, width: "100%", margin: "4px 0" },
  dividerLine: { flex: 1, height: 1, background: "#D8D2C6" },
  dividerLabel: { fontSize: 11, color: "#B3A89E", fontWeight: 500 },
  secondaryBtn: {
    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
    background: "white", color: "#1C1610",
    border: "1px solid #D8D2C6", borderRadius: 999,
    padding: "12px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  hint: { fontSize: 11, color: "#B3A89E", textAlign: "center" as const, lineHeight: 1.5, marginTop: 2 },
};

interface WorkspaceEmptyStateProps {
  workspaceId: string;
  isPersonal?: boolean;
  isPrivate?: boolean;
  onCreatePublicWorkspace?: () => void;
}

export function WorkspaceEmptyState({
  workspaceId,
  isPersonal,
  isPrivate,
  onCreatePublicWorkspace,
}: WorkspaceEmptyStateProps) {
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const isRestricted = isPersonal || isPrivate;

  return (
    <div style={s.container}>

      {/* Icon */}
      <div style={s.iconBox}>
        {isRestricted
          ? <Lock size={28} color="#C4956A" strokeWidth={1.8} />
          : <FileText size={28} color="#C4956A" strokeWidth={1.8} />
        }
      </div>

      {/* Text */}
      <div style={s.textBlock}>
        <p style={s.title}>
          {isPersonal
            ? "Your personal creative space"
            : isPrivate
            ? "Your private workspace"
            : "Nothing here yet"}
        </p>
        <p style={s.subtitle}>
          {isPersonal
            ? "This workspace is just for you — build forms, collect responses, and analyse results. Collaboration and plan upgrades aren't available here."
            : isPrivate
            ? "Private workspaces are visible only to you. You can still build and publish forms, but team invites aren't available."
            : "Get started by creating your first form below."}
        </p>
      </div>

      {/* CTAs */}
      <div style={s.ctaStack}>
        <CreateFormModal workspaceId={workspaceId} open={createFormOpen} onOpenChange={setCreateFormOpen}>
          <button style={s.primaryBtn}>
            <FileText size={15} />
            Create your first form
          </button>
        </CreateFormModal>

        {isRestricted && onCreatePublicWorkspace && (
          <>
            <div style={s.dividerRow}>
              <div style={s.dividerLine} />
              <span style={s.dividerLabel}>or</span>
              <div style={s.dividerLine} />
            </div>

            <button onClick={onCreatePublicWorkspace} style={s.secondaryBtn}>
              <Users size={14} />
              Create a public workspace
              <ArrowRight size={13} color="#B3A89E" />
            </button>
            <p style={s.hint}>
              Invite your team, unlock Pro features and advanced analytics
            </p>
          </>
        )}
      </div>
    </div>
  );
}
