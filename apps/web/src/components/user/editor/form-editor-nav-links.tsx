"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useFormEditorStore } from "@/store/use-form-editor-store";

export function NavbarLinks() {
  const { workspaceId, formId } = useParams<{
    workspaceId: string;
    formId: string;
  }>();
  const pathname = usePathname();
  const isPublished = useFormEditorStore((s) => (s.form?.publishVersion ?? 0) > 0);

  const base = `/ws/${workspaceId}/f/${formId}`;

  const navLinks = [
    { label: "Editor", href: `${base}/editor` },
    ...(isPublished
      ? [
          { label: "Analytics", href: `${base}/analytics` },
          { label: "Results", href: `${base}/result` },
        ]
      : []),
    { label: "Share", href: `${base}/share` },
  ];

  return (
    <nav className="flex items-center">
      {navLinks.map((link) => {
        const isActive = pathname.startsWith(link.href);

        return (
          <Link
            key={link.label}
            href={link.href}
            className={cn(
              "relative flex items-center px-3 h-12 text-sm font-medium transition-colors",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
            {isActive && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-foreground rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
