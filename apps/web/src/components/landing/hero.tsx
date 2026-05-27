"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useCallback } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

const SLIDES = [
  { src: "/editor.png",    alt: "Flowform form editor",    label: "Form Editor"   },
  { src: "/analytics.png", alt: "Flowform analytics",      label: "Analytics"     },
];

function HeroCarousel() {
  const plugin = useRef(Autoplay({ delay: 3500, stopOnInteraction: true }));
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const onSetApi = useCallback((newApi: CarouselApi) => {
    if (!newApi) return;
    setApi(newApi);
    newApi.on("select", () => setCurrent(newApi.selectedScrollSnap()));
  }, []);

  return (
    <div className="relative w-full px-6 max-w-5xl mx-auto pb-0 z-10">
      <div className="relative rounded-2xl overflow-hidden border border-white/6 shadow-[0_0_100px_rgba(0,0,0,0.6)]">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/6 bg-[#0E0A07]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          <div className="mx-auto w-52 h-5 rounded-md bg-white/10" />
        </div>

        {/* Carousel */}
        <Carousel
          setApi={onSetApi}
          opts={{ loop: true }}
          plugins={[plugin.current]}
          className="w-full"
        >
          <CarouselContent className="ml-0">
            {SLIDES.map((slide) => (
              <CarouselItem key={slide.src} className="pl-0">
                <div className="relative w-full aspect-video bg-[#1C1610]">
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1024px"
                    className="object-cover object-top"
                    priority
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Dot indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => api?.scrollTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-5 h-1.5 bg-[#D9B38C]"
                  : "w-1.5 h-1.5 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>

        {/* Slide label */}
        <div className="absolute bottom-3 right-4 text-[10px] font-semibold tracking-[0.14em] uppercase text-white/30">
          {SLIDES[current]?.label}
        </div>
      </div>
    </div>
  );
}

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

        {/* Screenshot carousel */}
        <HeroCarousel />

        {/* Gradient beneath carousel */}
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
