import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  WorkspaceNavbar,
  WorkspaceSidebar,
  WorkspaceOverviewSection,
} from "@/components/user/workspace";

export default function Page({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  return (
    <SidebarProvider>
      <WorkspaceSidebar />
      <SidebarInset>
        <WorkspaceNavbar />
        <div className="flex flex-1 overflow-y-auto">
          <WorkspaceOverviewSection params={params} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
