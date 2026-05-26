import Link from "next/link";

function BuilderMockup() {
  const fields = ["Full Name", "Email Address", "Your Message"];
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#1C1610]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.07] bg-[#0E0A07]">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 h-5 rounded-md bg-white/8 mx-4 flex items-center px-2">
          <span className="text-[0.55rem] text-white/25">flowform.in/f/contact-us</span>
        </div>
        <div className="w-16 h-5 rounded-md bg-[#D9B38C]/20 flex items-center justify-center">
          <span className="text-[0.55rem] font-semibold text-[#D9B38C]/70">Publish</span>
        </div>
      </div>

      <div className="flex" style={{ minHeight: 260 }}>
        {/* Left sidebar — field types */}
        <div className="w-36 shrink-0 border-r border-white/[0.07] px-3 py-4 flex flex-col gap-2">
          <p className="text-[0.6rem] font-semibold tracking-widest uppercase text-[#6B5E52] mb-1">Fields</p>
          {["Short Text", "Email", "Radio", "Rating", "Date", "Yes / No"].map((f) => (
            <div key={f} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D9B38C]/50" />
              <span className="text-[0.65rem] text-[#9E8E7E]">{f}</span>
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div className="flex-1 px-6 py-5 flex flex-col gap-4">
          <p className="text-[0.65rem] font-bold text-white/50 tracking-wider uppercase">Contact Form</p>
          {fields.map((f, i) => (
            <div key={f} className={`flex flex-col gap-1.5 ${i === 1 ? "opacity-60" : ""}`}>
              <span className="text-[0.6rem] text-white/50 font-medium">{f}</span>
              <div className={`h-9 w-full rounded-lg border flex items-center px-3 ${i === 0 ? "border-[#D9B38C]/60 bg-[#D9B38C]/5" : "border-white/10 bg-white/5"}`}>
                {i === 0 && <span className="text-[0.6rem] text-[#D9B38C]/50">Enter your name...</span>}
              </div>
            </div>
          ))}
          <div className="mt-1 w-20 h-8 rounded-lg bg-[#D9B38C]/80 flex items-center justify-center">
            <span className="text-[0.65rem] font-bold text-[#17120D]">Submit</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsMockup() {
  const bars = [65, 82, 45, 91, 58, 74, 88];
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#1C1610]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.07] flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[#F5EFE6] mb-1">Response Analytics</p>
          <p className="text-xs text-[#6B5E52]">Last 7 days</p>
        </div>
        <div className="flex gap-2">
          <div className="h-7 px-2.5 rounded-lg bg-white/8 border border-white/10 flex items-center">
            <span className="text-[0.6rem] text-[#6B5E52] font-medium">All time</span>
          </div>
          <div className="h-7 px-2.5 rounded-lg bg-[#D9B38C]/20 border border-[#D9B38C]/30 flex items-center">
            <span className="text-[0.6rem] text-[#D9B38C] font-semibold">Export CSV</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total Responses", val: "1,284" },
            { label: "Completion Rate", val: "73%" },
            { label: "Avg. Time", val: "2m 14s" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/4 px-3 py-3">
              <p className="text-[0.6rem] text-[#6B5E52] font-semibold tracking-wider uppercase mb-1">{s.label}</p>
              <p className="text-[#D9B38C] font-bold text-lg leading-none">{s.val}</p>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-2 h-24">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%`, background: i === 3 ? "#D9B38C" : "rgba(217,179,140,0.25)" }} />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <span key={d} className="flex-1 text-center text-[0.55rem] text-[#6B5E52] font-medium">{d}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DarkFeatures() {
  return (
    <section id="builder" className="bg-[#17120D] px-6 pt-16 pb-32">
      <div className="max-w-5xl mx-auto">
        {/* Headline */}
        <div className="text-center mb-20">
          <h2
            className="font-bold text-[#F5EFE6] leading-[1.1]"
            style={{ fontSize: "clamp(1.9rem, 3.5vw, 2.8rem)" }}
          >
            Built to collect.
            <br />
            <span className="text-[#D9B38C]">Designed to understand.</span>
          </h2>
          <p className="mt-4 text-[#6B5E52] text-base max-w-md mx-auto leading-relaxed mb-0">
            A form builder and response analytics that actually talk to each other — so you spend less time managing and more time acting on what you learn.
          </p>
        </div>

        {/* Feature 1 — visual left, text right */}
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 mb-24">
          <div className="flex-1 w-full">
            <BuilderMockup />
          </div>
          <div className="flex-1 flex flex-col items-start">
            <span className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#A68A6D] mb-4">
              Form Builder
            </span>
            <h3
              className="font-bold text-[#F5EFE6] leading-[1.15] mb-4"
              style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}
            >
              Drag, drop, done.
            </h3>
            <p className="text-[#9E8E7E] text-base leading-relaxed mb-6 max-w-sm">
              Pick from a library of field types, arrange them your way, and
              customize every detail — colors, labels, logic. What used to take
              hours now takes minutes.
            </p>
            <ul className="flex flex-col gap-2.5 mb-8">
              {["12 field types", "Conditional logic", "Custom branding", "Mobile-ready by default"].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-[#9E8E7E]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9B38C] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#D9B38C] text-[#17120D] hover:bg-[#C9A37C] active:scale-[0.97] transition-all duration-150"
            >
              Start building
            </Link>
          </div>
        </div>

        {/* Feature 2 — text left, visual right */}
        <div className="flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-16">
          <div className="flex-1 flex flex-col items-start">
            <span className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#A68A6D] mb-4">
              Response Analytics
            </span>
            <h3
              className="font-bold text-[#F5EFE6] leading-[1.15] mb-4"
              style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}
            >
              Responses that
              <br />actually tell you something.
            </h3>
            <p className="text-[#9E8E7E] text-base leading-relaxed mb-6 max-w-sm">
              Every submission lands in a clean dashboard. Filter by date,
              track completion rates, and spot trends — without needing a
              separate analytics tool.
            </p>
            <ul className="flex flex-col gap-2.5 mb-8">
              {["Real-time submissions", "Completion rate tracking", "CSV export", "Device & geo analytics"].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-[#9E8E7E]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9B38C] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold border border-[#D9B38C]/40 text-[#D9B38C] hover:bg-[#D9B38C]/10 active:scale-[0.97] transition-all duration-150"
            >
              See analytics
            </Link>
          </div>
          <div className="flex-1 w-full">
            <AnalyticsMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
