"use client";

import React from "react";
import { WorkspaceNavbar } from "./workspace-navbar";

export function WorkspaceTabView({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = React.useState("Forms");

  return (
    <>
      <WorkspaceNavbar />
      {activeTab === "Forms" ? (
        children
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Polls coming soon.</p>
        </div>
      )}
    </>
  );
}