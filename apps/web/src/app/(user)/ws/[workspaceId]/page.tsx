import { WorkspaceNavbar } from "@/components/user/workspace/workspace-navbar";
import { WorkspaceSidebar } from "@/components/user/workspace/workspace-sidebar";
import WorkspaceOverviewPage from "@/components/user/workspace/workspace-overview";

export default function Page({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <WorkspaceNavbar />
      <main className="flex flex-1 overflow-hidden">
        <WorkspaceSidebar />
        <div className="flex flex-1 overflow-y-auto">
          <WorkspaceOverviewPage params={params} />
        </div>
      </main>
    </div>
  );
}
