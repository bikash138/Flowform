import Image from "next/image";
import Link from "next/link";
import heroImage from "@/assets/hero-image.webp";
import { SwooshUnderline } from "@/components/landing/ui/swoosh-underline";
import { GradientButton } from "@/components/landing/ui/gradient-button";

const PILL_ITEMS = ["Forms", "Polls", "Quizzes"] as const;

const pillLinkClass =
  "text-[0.7rem] font-bold tracking-widest uppercase text-nav-ink-hover hover:-translate-y-0.5 transition-transform duration-150 inline-block";

export function Hero() {
  return (
    <section id="hero" className="relative w-full overflow-hidden">
      {/* Hero image */}
      <div className="relative w-full" style={{ height: "70vh", minHeight: 480 }}>
        <Image
          src={heroImage}
          alt="Hero background"
          fill
          priority
          quality={75}
          sizes="100vw"
          placeholder="blur"
          className="object-cover object-center"
        />
        {/* Bottom fade */}
        <div
          aria-hidden
          className="absolute bottom-0 left-0 w-full h-2/5 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(253,250,246,0.7) 50%, var(--landing-bg) 100%)",
          }}
        />
      </div>

      {/* Text content */}
      <div
        id="hero-text-start"
        className="relative -mt-32 flex flex-col items-center text-center px-6 pb-20 z-10"
      >
        {/* Pill badge */}
        <div className="mb-5 flex items-center gap-2 px-6 py-2 rounded-full border border-nav-ink/15">
          {PILL_ITEMS.map((item, i) => (
            <span key={item} className="flex items-center gap-2">
              {i > 0 && <span className="text-nav-ink-hover/70 text-lg font-bold">·</span>}
              <Link href="/explore" className={pillLinkClass}>{item}</Link>
            </span>
          ))}
        </div>

        {/* Headline */}
        <h1
          className="font-bold text-nav-ink leading-[1.08] max-w-2xl"
          style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
        >
          Your audience is waiting
          <br />
          <span className="relative inline-block">
            Ask them something
            <SwooshUnderline />
          </span>
        </h1>

        {/* Subtext */}
        <p className="mt-3 text-hero-subtext text-base md:text-lg leading-relaxed max-w-xl text-balance font-semibold">
          Create forms that people genuinely complete. Because when it's this easy to fill out, it's this easy to get results.
        </p>

        {/* CTA buttons */}
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold bg-nav-ink text-nav-cream hover:bg-nav-ink-hover active:scale-[0.97] transition-all duration-150 shadow-md shadow-black/15"
          >
            Start for free
          </Link>
          <GradientButton href="#templates">Browse templates</GradientButton>
        </div>

        <p className="mt-3 text-xs text-hero-muted font-medium tracking-wide">
          No credit card required &nbsp;·&nbsp; Free plan available
        </p>
      </div>

    </section>
  );
}
