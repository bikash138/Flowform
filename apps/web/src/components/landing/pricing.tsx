"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Check } from "lucide-react";

const FREE_FEATURES = [
  "100 responses / month",
  "3 active forms",
  "3 team members",
  "6 basic themes",
  "Progress bar",
  "Access code protection",
  "Standard sharing link",
  "Basic response dashboard",
];

const PRO_FEATURES = [
  "Everything in Free",
  "2,000 responses / month",
  "20 active forms",
  "10 team members",
  "Premium themes",
  "Custom slug URL",
  "Custom branded navbar",
  "Multi-language forms",
  "Custom form close date",
  "Advanced analytics",
];

const PRO_MAX_FEATURES = [
  "10,000 responses / month",
  "50 active forms",
  "30 team members",
  "Exclusive Pro Max themes",
  "Remove Flowform watermark",
  "Redirect on completion",
  "Email confirmation to respondents",
  "Custom email theme & branding",
];

type PlanCardProps = {
  tier: string;
  badge?: string;
  price: string;
  description: string;
  cta: string;
  features: string[];
};

function PlanCard({ tier, badge, price, description, cta, features }: PlanCardProps) {
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  return (
    <div className="rounded-2xl p-8 flex flex-col bg-white border border-[#E8DDD0]">
      <div className="mb-6 h-[108px] flex flex-col justify-start">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#A68A6D]">{tier}</p>
          {badge && (
            <span className="text-[0.6rem] font-semibold px-2 py-0.5 rounded-full bg-[#D9B38C]/20 text-[#92683A] border border-[#D9B38C]/30">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold text-[#2B2B2B]">{price}</span>
          <span className="text-sm mb-1.5 text-[#A68A6D]">/ month</span>
        </div>
        <p className="text-sm mt-2 leading-relaxed text-[#6B6256]">{description}</p>
      </div>

      <Link
        ref={ctaRef}
        href="/signup"
        onMouseMove={(e) => {
          const rect = ctaRef.current?.getBoundingClientRect();
          if (!rect) return;
          setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative overflow-hidden w-full flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 mb-8 border border-[#D9B38C] text-[#92683A] active:scale-[0.98]"
        style={{
          background: hovered
            ? `radial-gradient(circle 80px at ${pos.x}px ${pos.y}px, color-mix(in srgb, #D9B38C 30%, transparent), transparent 70%)`
            : "transparent",
        }}
      >
        {cta}
      </Link>

      <ul className="flex flex-col gap-3">
        {features.map((text) => (
          <li key={text} className="flex items-start gap-3">
            <Check size={15} className="text-[#D9B38C] shrink-0 mt-0.5" strokeWidth={2.5} />
            <span className="text-sm leading-snug text-[#6B6256]">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProCard() {
  return (
    <div
      id="pricing-pro-card"
      className="rounded-2xl p-8 flex flex-col relative overflow-hidden bg-[#2B1F14] border-2 border-[#D9B38C] shadow-xl shadow-[#D9B38C]/10"
    >
      <style>{`
        @keyframes metallic-bg {
          0%   { background-position: -200% center; }
          100% { background-position: 300% center; }
        }
        @keyframes border-pulse {
          0%, 100% { box-shadow: 0 0 18px 2px rgba(217,179,140,0.10); }
          50%       { box-shadow: 0 0 32px 6px rgba(217,179,140,0.22); }
        }
        .pro-card { animation: border-pulse 3s ease-in-out infinite; }
        .pro-sweep {
          background: linear-gradient(
            105deg,
            transparent 38%,
            rgba(255, 224, 160, 0.08) 46%,
            rgba(255, 236, 180, 0.18) 50%,
            rgba(255, 224, 160, 0.08) 54%,
            transparent 62%
          );
          background-size: 250% 100%;
          animation: metallic-bg 8s linear infinite;
        }
      `}</style>

      {/* Sweep shine */}
      <div aria-hidden className="pro-sweep pointer-events-none absolute inset-0 z-10" />

      {/* Top glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-72 h-24 opacity-25 z-0"
        style={{ background: "radial-gradient(ellipse at 50% 0%, #D9B38C, transparent 70%)" }}
      />

      {/* Header */}
      <div className="relative z-10 mb-6 h-[108px] flex flex-col justify-start">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#D9B38C]">Pro</p>
          <span className="text-[0.6rem] font-semibold px-2 py-0.5 rounded-full bg-[#D9B38C]/15 text-[#D9B38C] border border-[#D9B38C]/20">
            Most popular
          </span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold text-[#F5EFE6]">$10</span>
          <span className="text-sm mb-1.5 text-[#9E8070]">/ month</span>
        </div>
        <p className="text-sm mt-2 leading-relaxed text-[#9E8070]">For individuals and small teams.</p>
      </div>

      {/* CTA */}
      <Link
        href="/signup"
        className="relative z-10 w-full flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 mb-8 bg-[#D9B38C] text-[#17120D] hover:bg-[#C9A37C] active:scale-[0.98] shadow-md"
      >
        Start free — upgrade anytime
      </Link>

      {/* Features */}
      <ul className="relative z-10 flex flex-col gap-3">
        {PRO_FEATURES.map((text) => (
          <li key={text} className="flex items-start gap-3">
            <Check size={15} className="text-[#D9B38C] shrink-0 mt-0.5" strokeWidth={2.5} />
            <span className="text-sm leading-snug text-[#C4A882]">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="bg-[#FDFAF6] px-6 pt-24 pb-28">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#A68A6D] block mb-4">
            Pricing
          </span>
          <h2
            className="font-bold text-[#2B2B2B] leading-[1.1] mb-4"
            style={{ fontSize: "clamp(1.9rem, 3.5vw, 2.6rem)" }}
          >
            Simple, honest pricing.
          </h2>
          <p className="text-[#6B6256] text-base max-w-sm mx-auto leading-relaxed">
            Start free, upgrade when you need more. No hidden fees, no surprises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <PlanCard
            tier="Free"
            price="$0"
            description="Everything you need to get started."
            cta="Get started free"
            features={FREE_FEATURES}
          />
          <ProCard />
          <PlanCard
            tier="Pro Max"
            price="$25"
            description="For brands that want full control."
            cta="Get Pro Max"
            features={PRO_MAX_FEATURES}
          />
        </div>

        <p className="text-center text-xs text-[#A68A6D] mt-10 font-medium">
          No credit card required to start &nbsp;·&nbsp; Cancel anytime
        </p>
      </div>
    </section>
  );
}
