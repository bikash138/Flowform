import Link from "next/link";

export function Hero() {
  return (
    <>
      <section className="relative flex flex-col items-center bg-[#17120D]">
        {/* Top ambient warm glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] opacity-30"
          style={{
            background:
              "radial-gradient(ellipse 70% 65% at 50% 0%, #D9B38C 0%, #C49060 30%, transparent 70%)",
          }}
        />

        {/* Hero content */}
        <div className="relative flex flex-col items-center px-6 pt-40 pb-16">
          {/* Badge */}
          <div className="mb-7 flex items-center px-4 py-1.5 rounded-full border border-[#D9B38C]/30 bg-[#D9B38C]/10">
            <span className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#D9B38C]/80">
              Form Builder &nbsp;·&nbsp; Surveys &nbsp;·&nbsp; Polls
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-center font-bold text-[#F5EFE6] leading-[1.08] mb-0 max-w-3xl"
            style={{ fontSize: "clamp(2.6rem, 6vw, 4.25rem)" }}
          >
            Build forms your
            <br />
            <span className="relative inline-block">
              <span className="relative z-10">respondents love.</span>
              <span
                aria-hidden
                className="absolute left-0 bottom-1 w-full h-[0.16em] rounded-full opacity-50"
                style={{ background: "#D9B38C" }}
              />
            </span>
          </h1>

          {/* Subtext */}
          <p className="mt-7 text-center text-[#9E8E7E] text-base md:text-lg leading-relaxed max-w-xl mb-0">
            Create polished forms, surveys, and polls in minutes. Share them
            anywhere and collect real responses — no friction, no complexity.
          </p>

          {/* CTAs */}
          <div className="mt-9 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold bg-[#D9B38C] text-[#17120D] hover:bg-[#C9A37C] active:scale-[0.97] transition-all duration-150 shadow-md shadow-black/20"
            >
              Start for free
            </Link>
            <Link
              href="#templates"
              className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-[#D9B38C] border border-[#D9B38C]/40 hover:bg-[#D9B38C]/10 active:scale-[0.97] transition-all duration-150"
            >
              Browse templates
            </Link>
          </div>

          {/* Social proof */}
          <p className="mt-7 text-xs text-[#6B5E52] font-medium tracking-wide">
            No credit card required &nbsp;·&nbsp; Free plan available
          </p>
        </div>

        {/* Video placeholder */}
        <div className="relative w-full px-6 max-w-5xl mx-auto pb-0 z-10">
          <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] shadow-[0_0_100px_rgba(0,0,0,0.6)]">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06] bg-[#0E0A07]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
              <div className="mx-auto w-52 h-5 rounded-md bg-white/10" />
            </div>
            {/* Video area */}
            <div className="aspect-video w-full flex items-center justify-center bg-[#1C1610]">
              <div className="flex flex-col items-center gap-4 select-none">
                <div className="w-16 h-16 rounded-full border border-[#D9B38C]/30 flex items-center justify-center bg-[#D9B38C]/10 hover:bg-[#D9B38C]/20 transition-colors cursor-pointer">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M7 5L17 11L7 17V5Z" fill="#D9B38C" opacity="0.8" />
                  </svg>
                </div>
                <span className="text-[#D9B38C]/30 text-[0.65rem] font-semibold tracking-[0.18em] uppercase">
                  Demo video
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Gradient beneath video */}
        <div
          aria-hidden
          className="pointer-events-none w-full h-[480px] -mt-80"
          style={{
            background: `
              radial-gradient(ellipse 85% 45% at 50% 58%, #D9B38C 0%, #C49060 25%, transparent 65%),
              linear-gradient(to bottom, #17120D 0%, #17120D 38%, #FDFAF6 90%, #FDFAF6 100%)
            `,
          }}
        />
      </section>
    </>
  );
}
