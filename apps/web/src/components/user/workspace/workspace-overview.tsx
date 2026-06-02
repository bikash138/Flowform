"use client";

import { use, useState } from "react";
import { Search } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useForms } from "@/hooks/user/use-form";
import {
  useFormUsage,
  useMemberUsage,
  useRemainingQuota,
  useWorkspacePlan,
} from "@/hooks/user/use-billing";
import { useWorkspace } from "@/hooks/user/use-workspace-core";
import { useGetWorkspaceMembers } from "@/hooks/user/use-workspace-member";
import { authClient } from "@/lib/auth";
import { WorkspaceEmptyState } from "./workspace-empty-state";
import { CreateWorkspaceModal } from "@/components/modals/create-workspace-modal";
import { PlansModal } from "@/components/modals/plans-modal";
import { WorkspaceSettingsModal } from "@/components/modals/workspace-settings/workspace-settings-modal";
import { WorkspaceTypeBanner } from "./core/dashboard-bento/workspace-type-banner";
import { UpgradeButton } from "./core/dashboard-bento/upgrade-button";
import { FormsListCard } from "./core/dashboard-bento/forms-list-card";
import { BlobChartCard } from "./core/dashboard-bento/blob-chart-card";
import { TeamMembersCard } from "./core/dashboard-bento/team-members-card";
import { UsageLimitsCard } from "./core/dashboard-bento/usage-limits-card";

export function WorkspaceOverviewSection({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);

  const { data: forms, isLoading } = useForms(workspaceId);
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: formUsage } = useFormUsage(workspaceId);
  const { data: memberUsage } = useMemberUsage(workspaceId);
  const { data: quota } = useRemainingQuota(workspaceId);
  const { data: workspacePlan } = useWorkspacePlan(workspaceId);
  const { data: members = [] } = useGetWorkspaceMembers(workspaceId);
  const { data: session } = authClient.useSession();

  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  const userFirstName = session?.user?.name?.split(" ")[0] ?? "there";
  const planId = workspacePlan?.planId;
  const totalResponses = forms?.reduce((s, f) => s + (f.responseCount ?? 0), 0) ?? 0;

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#EDE8E0" }}>
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!forms || forms.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#EDE8E0" }}>
        <WorkspaceEmptyState
          workspaceId={workspaceId}
          isPersonal={workspace?.isPersonal}
          isPrivate={workspace?.isPrivate}
          onCreatePublicWorkspace={() => setCreateWorkspaceOpen(true)}
        />
        <CreateWorkspaceModal open={createWorkspaceOpen} onOpenChange={setCreateWorkspaceOpen} />
      </div>
    );
  }

  const sortedForms = [...forms].sort(
    (a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime(),
  );

  return (
    <>
      <style>{`
        @keyframes ripple {
          0%   { transform: scale(1); opacity: 0.45; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .ws-ripple-1 { animation: ripple 2s ease-out infinite; }
        .ws-ripple-2 { animation: ripple 2s ease-out infinite 0.7s; }

        @media (max-width: 768px) {
          .ws-grid { grid-template-columns: 1fr !important; height: auto !important; min-height: unset !important; }
          .ws-left-col { grid-column: 1 !important; grid-row: auto !important; height: 480px !important; }
          .ws-right-col-1,
          .ws-right-col-2,
          .ws-right-col-3 { grid-column: 1 !important; grid-row: auto !important; }
          .ws-blob-wrapper { height: 112px !important; justify-content: flex-start !important; }
          .ws-blob-container { transform: scale(0.65) !important; transform-origin: left top !important; }
          .ws-blob-legend { display: none !important; }
          .ws-topbar-right { display: none !important; }
        }
      `}</style>

      <div style={{ flex: 1, background: "#EDE8E0", overflowY: "auto", overflowX: "hidden", padding: "24px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px" }}>

          {workspace && (workspace.isPersonal || workspace.isPrivate) && (
            <WorkspaceTypeBanner
              isPersonal={workspace.isPersonal}
              isPrivate={workspace.isPrivate}
              onCreatePublic={() => setCreateWorkspaceOpen(true)}
            />
          )}

          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: 22, fontWeight: 800, color: "#1C1610", marginBottom: 4, letterSpacing: "-0.01em" }}>
                {workspace?.title ?? "My Workspace"}
              </p>
              <p style={{ fontSize: 13, color: "#8C7B6E", fontWeight: 600 }}>
                {userFirstName}, what are you looking for today!
              </p>
            </div>
            <div className="ws-topbar-right" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginTop: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", borderRadius: 999, padding: "9px 16px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
                <Search size={13} color="#B3A89E" />
                <span style={{ fontSize: 12, color: "#B3A89E" }}>Search forms…</span>
              </div>
              <UpgradeButton planId={planId} onClick={() => setPlansOpen(true)} />
            </div>
          </div>

          {/* Bento grid */}
          <div
            className="ws-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "minmax(320px, 5fr) auto minmax(240px, 3fr)",
              gap: 20,
              minHeight: 780,
            }}
          >
            <FormsListCard workspaceId={workspaceId} forms={sortedForms} />
            <BlobChartCard totalViews={totalResponses} totalForms={forms.length} submitted={138} />
            <TeamMembersCard members={members} memberUsage={memberUsage} onInviteClick={() => setMembersOpen(true)} />
            <UsageLimitsCard quota={quota} formUsage={formUsage} memberUsage={memberUsage} planId={planId} onUpgradeClick={() => setPlansOpen(true)} />
          </div>
        </div>
      </div>

      <CreateWorkspaceModal open={createWorkspaceOpen} onOpenChange={setCreateWorkspaceOpen} />
      <PlansModal open={plansOpen} onOpenChange={setPlansOpen} currentPlanId={planId ?? "FREE"} />
      <WorkspaceSettingsModal
        open={membersOpen}
        onOpenChange={setMembersOpen}
        defaultTab="members"
        workspace={workspace ? {
          id: workspace.id,
          title: workspace.title,
          logo: workspace.logo,
          isPersonal: workspace.isPersonal,
          isPrivate: workspace.isPrivate,
          myRole: workspace.myRole,
        } : undefined}
      />
    </>
  );
}
