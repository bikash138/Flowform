"use client";

import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

const TEMPLATES = [
  {
    name: "Contact Form",
    description: "Let visitors reach you directly. Clean, simple, effective.",
    fields: ["Full Name", "Email", "Message"],
    accent: "#D9B38C",
    bg: "#FAF7F0",
  },
  {
    name: "Customer Feedback",
    description: "Understand what your customers actually think about your product.",
    fields: ["Overall rating", "What went well?", "What can improve?"],
    accent: "#A68A6D",
    bg: "#F5EDE0",
  },
  {
    name: "Event Registration",
    description: "Collect RSVPs and attendee details for any event effortlessly.",
    fields: ["Full Name", "Email", "Number of guests"],
    accent: "#8B6D4E",
    bg: "#EDE0D0",
  },
  {
    name: "Job Application",
    description: "A structured form for candidates to apply to open positions.",
    fields: ["Full Name", "LinkedIn URL", "Cover note"],
    accent: "#C49A6C",
    bg: "#F7F0E6",
  },
  {
    name: "Product Survey",
    description: "Gather structured feedback to shape your next product decision.",
    fields: ["How did you hear about us?", "Rating", "Suggestions"],
    accent: "#B8925A",
    bg: "#F2E8DA",
  },
  {
    name: "Lead Capture",
    description: "Turn visitors into leads with a focused, high-converting form.",
    fields: ["Name", "Work email", "Company size"],
    accent: "#9E7A55",
    bg: "#EDE3D8",
  },
  {
    name: "NPS Survey",
    description: "Measure how likely your users are to recommend you to others.",
    fields: ["Score (0–10)", "What's the main reason?", "Anything else?"],
    accent: "#D4A574",
    bg: "#FAF3EA",
  },
  {
    name: "Order Form",
    description: "Accept product or service orders with all the details you need.",
    fields: ["Product", "Quantity", "Delivery address"],
    accent: "#A07848",
    bg: "#EBE0D2",
  },
];

function TemplateCard({ name, description, fields, accent, bg }: (typeof TEMPLATES)[0]) {
  return (
    <div className="group flex flex-col rounded-2xl border border-[#E8DDD0] bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-full">
      {/* Preview area */}
      <div
        className="px-6 pt-6 pb-5 flex flex-col gap-3"
        style={{ background: bg }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: accent }} />
          <span className="text-[0.6rem] font-bold tracking-[0.16em] uppercase" style={{ color: accent }}>
            {name}
          </span>
        </div>
        {fields.map((f) => (
          <div key={f} className="flex flex-col gap-1">
            <div className="h-2 rounded" style={{ width: `${f.length * 6.5}px`, background: `${accent}50` }} />
            <div className="h-8 w-full rounded-lg border bg-white/70" style={{ borderColor: `${accent}30` }} />
          </div>
        ))}
      </div>

      {/* Card footer */}
      <div className="px-5 py-4 flex flex-col gap-2 flex-1">
        <p className="text-sm font-bold text-[#2B2B2B] leading-snug">{name}</p>
        <p className="text-xs text-[#8B7B6B] leading-relaxed flex-1">{description}</p>
        <Link
          href="/signup"
          className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold border border-[#E8DDD0] text-[#2B2B2B] opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-[#F2E8DA]"
        >
          Use template
        </Link>
      </div>
    </div>
  );
}

export function Templates() {
  const plugin = useRef(Autoplay({ delay: 3000, stopOnInteraction: true }));

  return (
    <section id="templates" className="bg-[#FDFAF6] px-6 pt-24 pb-28">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#A68A6D] block mb-4">
              Templates
            </span>
            <h2
              className="font-bold text-[#2B2B2B] leading-[1.1] mb-0"
              style={{ fontSize: "clamp(1.9rem, 3.5vw, 2.6rem)" }}
            >
              Start in seconds,
              <br />not from scratch.
            </h2>
          </div>
          <p className="text-[#6B6256] text-sm leading-relaxed max-w-xs md:text-right mb-0">
            Pick a ready-made template, customize every field and style to match your brand, and publish in minutes.
          </p>
        </div>

        {/* Carousel */}
        <Carousel
          opts={{ align: "start", loop: true }}
          plugins={[plugin.current]}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {TEMPLATES.map((t) => (
              <CarouselItem key={t.name} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                <TemplateCard {...t} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex items-center justify-end gap-2 mt-8">
            <CarouselPrevious className="static translate-y-0 border-[#E8DDD0] bg-white hover:bg-[#F2E8DA] text-[#2B2B2B]" />
            <CarouselNext className="static translate-y-0 border-[#E8DDD0] bg-white hover:bg-[#F2E8DA] text-[#2B2B2B]" />
          </div>
        </Carousel>

        {/* Bottom CTA */}
        <div className="mt-10 text-center">
          <p className="text-sm text-[#9E8E7E]">
            Don&apos;t see what you need?{" "}
            <Link href="/signup" className="text-[#A68A6D] font-semibold hover:text-[#8B6D4E] transition-colors">
              Build from scratch →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
