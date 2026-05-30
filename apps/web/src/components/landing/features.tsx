"use client";

import { useRef, useState, useEffect } from "react";
import { CheckCircle2, ImageIcon } from "lucide-react";
import { TABS } from "@/data/features-tabs";

function FeatureImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="w-full rounded-2xl border border-[#E8DDD0] bg-[#F7F2EC] overflow-hidden flex flex-col items-center justify-center gap-3" style={{ minHeight: 480 }}>
      <div className="w-14 h-14 rounded-2xl bg-[#E8DDD0] flex items-center justify-center">
        <ImageIcon size={26} className="text-[#A68A6D]" strokeWidth={1.5} />
      </div>
      <p className="text-sm text-[#A68A6D] font-medium">{label} screenshot</p>
    </div>
  );
}

export function Features() {
  const [activeTab, setActiveTab] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sectionRefs.current.forEach((ref, index) => {
      if (!ref) return;
      const observer = new IntersectionObserver(
        (entries) => { entries.forEach((e) => { if (e.isIntersecting) setActiveTab(index); }); },
        { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
      );
      observer.observe(ref);
      observers.push(observer);
    });
    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  const scrollToSection = (index: number) =>
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <section id="features" className="bg-[#FDFAF6] px-6 pt-20 pb-24">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="landing-badge mb-5 block">Features</span>
          <h2 className="landing-h2">
            Build any form<br />in minutes.
          </h2>
          <p className="mt-4 text-[#6B6256] text-base max-w-md mx-auto leading-relaxed">
            Everything you need to create, customize, and analyze forms — in one place.
          </p>
        </div>

        {/* Two-column sticky layout — image LEFT, text RIGHT */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">

          {/* LEFT: sticky image panel */}
          <div className="hidden lg:flex flex-1 sticky top-0 h-screen items-center py-8">
            <div className="w-full relative" style={{ minHeight: 480 }}>
              {TABS.map((tab, i) => (
                <div key={tab.id} className={`mockup-panel ${activeTab === i ? "mockup-panel-active" : ""}`}>
                  <FeatureImagePlaceholder label={tab.label} />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: pill nav + stacked text sections */}
          <div className="flex-1 flex flex-col">

            {/* Pill nav — sticky below site navbar */}
            <div className="hidden lg:block sticky top-14 z-20">
              <div className="pt-6 pb-4 bg-[#FDFAF6]">
                <div className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full border border-[#E8DDD0] shadow-sm p-1">
                  {TABS.map((tab, i) => (
                    <button
                      key={tab.id}
                      onClick={() => scrollToSection(i)}
                      className={`feature-tab-btn ${activeTab === i ? "feature-tab-btn-active" : "feature-tab-btn-inactive"}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="feature-fade-gradient" />
            </div>

            {/* Tab sections */}
            {TABS.map((tab, i) => (
              <div
                key={tab.id}
                ref={(el) => { sectionRefs.current[i] = el; }}
                className="min-h-screen flex flex-col justify-center py-16"
              >
                <span className="landing-badge mb-5 block">{tab.badge}</span>
                <h3 className="feature-tab-h3 mb-4">{tab.title}</h3>
                <p className="text-[#6B6256] text-base leading-relaxed mb-6 max-w-sm">{tab.description}</p>
                <ul className="flex flex-col gap-3">
                  {tab.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-2.5 text-sm text-[#6B6256]">
                      <CheckCircle2 size={14} className="text-[#A68A6D] shrink-0" />
                      {bullet}
                    </li>
                  ))}
                </ul>

                {/* Mobile: image below text */}
                <div className="lg:hidden mt-10">
                  <FeatureImagePlaceholder label={tab.label} />
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
