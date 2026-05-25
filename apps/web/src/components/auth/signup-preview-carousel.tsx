"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { SLIDES } from "@/assets/signup/signup-carousel-image";

export function SignupPreviewCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const autoplay = useRef(Autoplay({ delay: 3000, stopOnInteraction: false }));
  const wheelGestures = useRef(WheelGesturesPlugin());

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center px-10 lg:px-16 pt-12">
        <Carousel
          setApi={setApi}
          opts={{ loop: true }}
          plugins={[autoplay.current, wheelGestures.current]}
          className="w-full max-w-sm"
        >
          <CarouselContent>
            {SLIDES.map((slide, i) => (
              <CarouselItem key={i}>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl">
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    width={440}
                    height={320}
                    className="h-auto w-full object-cover"
                    priority={i === 0}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="mt-4 flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => {
                api?.scrollTo(i);
                autoplay.current.reset();
              }}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "h-1.5 w-5 bg-white/80"
                  : "h-1.5 w-1.5 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="px-10 lg:px-16 pb-10 text-center">
        <p className="mb-4 text-xs font-medium text-white/40">
          Powerful form builder for modern workflows
        </p>
        <div className="flex items-center justify-center gap-6 opacity-40">
          <span className="text-xs font-bold tracking-wide">Conditional logic</span>
          <span className="text-xs font-bold tracking-wide">Flow-based UI</span>
          <span className="text-xs font-bold tracking-wide">Real-time responses</span>
          <span className="text-xs font-bold tracking-wide">Own branding</span>
        </div>
      </div>
    </>
  );
}
