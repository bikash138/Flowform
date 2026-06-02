import {
  WorkspaceSidebar,
  WorkspaceOverviewSection,
} from "@/components/user/workspace";

export default function Page({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-sidebar">
      <WorkspaceSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 overflow-y-auto">
          <WorkspaceOverviewSection params={params} />
        </div>
      </div>
    </div>
  );
}
