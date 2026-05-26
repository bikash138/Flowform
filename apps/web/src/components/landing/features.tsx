import Link from "next/link";
import { BarChart2, Zap, Paintbrush } from "lucide-react";

const BENEFITS = [
  {
    icon: Zap,
    title: "High Completion Rates",
    description:
      "Conversational or traditional layouts, built-in progress bars, and conditional logic keep respondents engaged from first question to submit.",
  },
  {
    icon: BarChart2,
    title: "Instant Response Insights",
    description:
      "Every submission hits your dashboard in real time with geographic data, device breakdown, and question-level analytics — no extra tools needed.",
  },
  {
    icon: Paintbrush,
    title: "Your Brand, Your Style",
    description:
      "12 built-in themes, custom fonts, colors, and border styles. On Pro Max, remove the Flowform watermark entirely.",
  },
];

function FormMockup() {
  return (
    <div className="w-full rounded-2xl border border-[#E8DDD0] bg-white shadow-[0_8px_48px_rgba(43,43,43,0.08)] overflow-hidden">
      {/* Form header */}
      <div className="px-6 pt-6 pb-4 border-b border-[#F0E8DE]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[#D9B38C]" />
          <span className="text-[0.65rem] font-semibold tracking-widest uppercase text-[#A68A6D]">
            Customer Feedback
          </span>
        </div>
        <p className="text-base font-bold text-[#2B2B2B]">How did we do today?</p>
      </div>

      {/* Form fields */}
      <div className="px-6 py-5 flex flex-col gap-5">
        {/* Field 1 — Short Text */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-[#6B6256]">Your Name</span>
          <div className="h-10 w-full rounded-lg border border-[#E8DDD0] bg-[#FDFAF6] flex items-center px-3">
            <span className="text-xs text-[#C0B0A0]">John Smith</span>
          </div>
        </div>

        {/* Field 2 — Radio */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-[#6B6256]">Overall Satisfaction</span>
          <div className="flex gap-2">
            {["Very satisfied", "Satisfied", "Neutral"].map((opt) => (
              <div
                key={opt}
                className="flex-1 h-9 rounded-lg border border-[#E8DDD0] bg-[#FDFAF6] flex items-center justify-center"
              >
                <span className="text-[0.6rem] text-[#8B7B6B] font-medium">{opt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Field 3 — Long Text */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-[#6B6256]">Any comments?</span>
          <div className="h-20 w-full rounded-lg border border-[#E8DDD0] bg-[#FDFAF6] flex items-start p-3">
            <span className="text-xs text-[#C0B0A0]">Share your thoughts...</span>
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-1">
          <div className="h-10 w-28 rounded-xl bg-[#2B2B2B] flex items-center justify-center">
            <span className="text-sm font-semibold text-white">Submit</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 pb-5 flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-[#F0E8DE] overflow-hidden">
          <div className="h-full w-2/3 rounded-full bg-[#D9B38C]" />
        </div>
        <span className="text-[0.65rem] font-semibold text-[#A68A6D]">
          2 / 3
        </span>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="bg-[#FDFAF6] px-6 pt-20 pb-24">
      <div className="max-w-5xl mx-auto">
        {/* Top: spotlight row */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left */}
          <div className="flex-1 flex flex-col items-start">
            <span className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#A68A6D] mb-5">
              Features
            </span>
            <h2
              className="text-[#2B2B2B] font-bold leading-[1.1] mb-5 max-w-sm"
              style={{ fontSize: "clamp(1.9rem, 3.5vw, 2.6rem)" }}
            >
              Build any form
              <br />
              in minutes.
            </h2>
            <p className="text-[#6B6256] text-base leading-relaxed mb-8 max-w-sm">
              Drag, drop, publish. No code, no complexity. Create contact forms,
              surveys, registration forms, and more — then share them anywhere
              and watch real responses come in.
            </p>
            <Link
              href="#templates"
              className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#2B2B2B] text-white hover:bg-[#3D3D3D] active:scale-[0.97] transition-all duration-150 shadow-sm"
            >
              Explore templates
            </Link>
          </div>

          {/* Right — form mockup */}
          <div className="flex-1 w-full max-w-md lg:max-w-none">
            <FormMockup />
          </div>
        </div>

        {/* Bottom: 3 benefit cards */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col gap-3 p-6 rounded-2xl border border-[#E8DDD0] bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F2E8DA] flex items-center justify-center">
                <Icon size={18} strokeWidth={2} className="text-[#A68A6D]" />
              </div>
              <h3 className="text-[#2B2B2B] font-bold text-base leading-snug mb-0">
                {title}
              </h3>
              <p className="text-[#6B6256] text-sm leading-relaxed mb-0">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
