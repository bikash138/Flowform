import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

type InfoPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  lastUpdated?: string;
  children: React.ReactNode;
};

/**
 * Shared shell for the standalone informational pages. Deliberately plain — a
 * document, not a marketing surface. No cards, no boxes: just type, rules and
 * whitespace.
 */
export function InfoPage({
  eyebrow,
  title,
  intro,
  lastUpdated,
  children,
}: InfoPageProps) {
  return (
    <div className="flex flex-1 flex-col bg-[#FDFAF6] font-sans">
      <Navbar />

      <main className="px-6 pb-32 pt-28 sm:pt-32">
        <div className="mx-auto max-w-2xl">
          <span className="block font-mono text-[0.7rem] font-medium uppercase tracking-[0.16em] text-[#A68A6D]">
            {eyebrow}
          </span>

          {/* text-balance evens the line lengths so the last word can't orphan */}
          <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.1] tracking-tight text-[#1C1610] sm:text-5xl">
            {title}
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-[#6B6256] sm:text-lg">
            {intro}
          </p>

          {lastUpdated ? (
            <p className="mt-6 font-mono text-xs text-[#B3A89E]">
              Last updated: {lastUpdated}
            </p>
          ) : null}

          {/* divide-y rules sit *between* sections, so the last one has no
              trailing separator hanging above the footer */}
          <div className="mt-14 divide-y divide-[#E8DDD0] border-t border-[#E8DDD0]">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/** A titled block of prose. Separators are drawn by the parent's divide-y. */
export function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-12">
      <h2 className="mb-4 text-xl font-bold tracking-tight text-[#1C1610]">
        {title}
      </h2>
      <div className="flex flex-col gap-4 text-[0.95rem] leading-[1.75] text-[#5C4E40]">
        {children}
      </div>
    </section>
  );
}
