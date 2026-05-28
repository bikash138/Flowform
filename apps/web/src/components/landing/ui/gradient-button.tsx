"use client";

import Link from "next/link";
import { useRef, useState } from "react";

export function GradientButton({ href, children }: { href: string; children: React.ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <Link
      ref={ref}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative inline-flex items-center overflow-hidden px-6 py-3 rounded-xl text-sm font-semibold text-nav-ink border border-nav-ink/20 active:scale-[0.97] transition-transform duration-150"
      style={{
        background: hovered
          ? `radial-gradient(circle 80px at ${pos.x}px ${pos.y}px, color-mix(in srgb, var(--hero-accent) 25%, transparent), transparent 70%)`
          : "transparent",
      }}
    >
      {children}
    </Link>
  );
}
