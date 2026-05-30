"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LEFT_TEMPLATES, RIGHT_TEMPLATES, type Template, type Shape } from "@/data/templates";

const SHAPE_STYLES: Record<Shape, React.CSSProperties> = {
  landscape: { height: 108, borderRadius: 20,  width: "100%" },
  squarish:  { aspectRatio: "1 / 1", borderRadius: 36, width: "100%" },
  tall:      { height: 185, borderRadius: 28,  width: "100%" },
  rounded:   { height: 144, borderRadius: 16,  width: "100%" },
  oval:      { height: 205, borderRadius: 999, width: "70%"  },
  circle:    { aspectRatio: "1 / 1", borderRadius: "50%", width: "65%" },
};

const CENTERED_SHAPES: Shape[] = ["oval", "circle"];

function ShapePlaceholder({ accent, bg, shape, image, name }: {
  accent: string;
  bg: string;
  shape: Shape;
  image: string | null;
  name: string;
}) {
  const baseStyle: React.CSSProperties = {
    background: `linear-gradient(145deg, ${bg} 0%, ${accent}55 65%, ${accent}20 100%)`,
    border: `1.5px solid ${accent}30`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
    position: "relative",
  };
  const dotStyle: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: `${accent}35`,
    border: `2px solid ${accent}55`,
  };

  const inner = (
    <div style={{ ...baseStyle, ...SHAPE_STYLES[shape] }}>
      {image
        ? <Image src={image} alt={name} fill className="object-cover" />
        : <div style={dotStyle} />
      }
    </div>
  );

  return CENTERED_SHAPES.includes(shape)
    ? <div style={{ display: "flex", justifyContent: "center" }}>{inner}</div>
    : inner;
}

function TemplateCard({ name, image, accent, bg, shape }: Template) {
  return (
    <div className="pb-5">
      <Link href={`/template?title=${encodeURIComponent(name)}`} className="flex flex-col gap-3 group">
        <ShapePlaceholder accent={accent} bg={bg} shape={shape} image={image} name={name} />
        <p className="px-1 text-sm font-bold text-[#2B2B2B] leading-snug group-hover:text-[#A68A6D] transition-colors">
          {name}
        </p>
      </Link>
    </div>
  );
}

function InfiniteColumn({ items, speedPx, direction }: {
  items: Template[];
  speedPx: number;
  direction: "up" | "down";
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ pos: 0, halfH: 0, paused: false });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const s = stateRef.current;
    s.halfH = track.scrollHeight / 2;
    if (direction === "down") s.pos = s.halfH;

    const tick = () => {
      if (!s.paused && s.halfH > 0) {
        if (direction === "up") {
          s.pos += speedPx;
          if (s.pos >= s.halfH) s.pos -= s.halfH;
        } else {
          s.pos -= speedPx;
          if (s.pos < 0) s.pos += s.halfH;
        }
        track.style.transform = `translate3d(0,${-s.pos}px,0)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [speedPx, direction]);

  return (
    <div
      className="flex-1 overflow-hidden"
      onMouseEnter={() => { stateRef.current.paused = true; }}
      onMouseLeave={() => { stateRef.current.paused = false; }}
    >
      <div ref={trackRef} className="flex flex-col" style={{ willChange: "transform" }}>
        {[...items, ...items].map((t, i) => <TemplateCard key={i} {...t} />)}
      </div>
    </div>
  );
}

export function Templates() {
  return (
    <section id="templates" className="bg-[#EDE5D8] h-screen overflow-hidden flex">
      <div className="h-full max-w-5xl mx-auto w-full px-12 pt-12 lg:px-6 lg:pt-0 flex flex-col lg:flex-row gap-16">

        {/* Heading + CTA */}
        <div className="lg:w-[380px] shrink-0 flex flex-col items-start justify-center">
          <span className="landing-badge mb-5 block">Templates</span>
          <h2 className="landing-h2 mb-5">
            Start in seconds,<br />not from scratch.
          </h2>
          <p className="text-[#6B6256] text-base leading-relaxed mb-8 max-w-xs">
            Pick a ready-made template, customize every field and style to match your brand, and publish in minutes.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#2B2B2B] text-white hover:bg-[#3D3D3D] active:scale-[0.97] transition-all duration-150 shadow-sm"
          >
            Browse templates
            <ArrowRight size={14} />
          </Link>
          <p className="mt-5 text-xs text-[#9E8E7E]">
            Don&apos;t see what you need?{" "}
            <Link href="/signup" className="text-[#A68A6D] font-semibold hover:text-[#8B6D4E] transition-colors">
              Build from scratch →
            </Link>
          </p>
        </div>

        {/* Two infinite-scroll columns */}
        <div className="template-columns-mask flex-1 h-full flex gap-4 overflow-hidden">
          <InfiniteColumn items={LEFT_TEMPLATES}  speedPx={0.6} direction="up"   />
          <InfiniteColumn items={RIGHT_TEMPLATES} speedPx={0.6} direction="down" />
        </div>

      </div>
    </section>
  );
}
