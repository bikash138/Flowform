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

type FieldPreview = {
  label: string;
  type: "text" | "textarea" | "rating" | "radio";
  placeholder?: string;
  options?: string[];
};

type Template = {
  name: string;
  description: string;
  fields: FieldPreview[];
  accent: string;
  bg: string;
};

const TEMPLATES: Template[] = [
  {
    name: "Contact Form",
    description: "Let visitors reach you directly. Clean, simple, effective.",
    accent: "#D9B38C",
    bg: "#FAF7F0",
    fields: [
      { label: "Full Name", type: "text", placeholder: "Jane Doe" },
      { label: "Email", type: "text", placeholder: "jane@example.com" },
      { label: "Message", type: "textarea", placeholder: "Hi there…" },
    ],
  },
  {
    name: "Customer Feedback",
    description: "Understand what your customers actually think about your product.",
    accent: "#A68A6D",
    bg: "#F5EDE0",
    fields: [
      { label: "Overall rating", type: "rating" },
      { label: "What went well?", type: "textarea", placeholder: "The onboarding was smooth…" },
      { label: "What can improve?", type: "text", placeholder: "Better docs would help" },
    ],
  },
  {
    name: "Event Registration",
    description: "Collect RSVPs and attendee details for any event effortlessly.",
    accent: "#8B6D4E",
    bg: "#EDE0D0",
    fields: [
      { label: "Full Name", type: "text", placeholder: "Alex Smith" },
      { label: "Email", type: "text", placeholder: "alex@company.com" },
      { label: "Number of guests", type: "radio", options: ["Just me", "2", "3+"] },
    ],
  },
  {
    name: "Job Application",
    description: "A structured form for candidates to apply to open positions.",
    accent: "#C49A6C",
    bg: "#F7F0E6",
    fields: [
      { label: "Full Name", type: "text", placeholder: "Jordan Lee" },
      { label: "LinkedIn URL", type: "text", placeholder: "linkedin.com/in/…" },
      { label: "Cover note", type: "textarea", placeholder: "Tell us why you're a great fit…" },
    ],
  },
  {
    name: "Product Survey",
    description: "Gather structured feedback to shape your next product decision.",
    accent: "#B8925A",
    bg: "#F2E8DA",
    fields: [
      { label: "How did you hear about us?", type: "radio", options: ["Twitter", "Friend", "Google"] },
      { label: "Overall rating", type: "rating" },
      { label: "Suggestions", type: "textarea", placeholder: "More integrations please…" },
    ],
  },
  {
    name: "Lead Capture",
    description: "Turn visitors into leads with a focused, high-converting form.",
    accent: "#9E7A55",
    bg: "#EDE3D8",
    fields: [
      { label: "Name", type: "text", placeholder: "Your name" },
      { label: "Work email", type: "text", placeholder: "you@company.com" },
      { label: "Company size", type: "radio", options: ["1–10", "11–50", "51+"] },
    ],
  },
  {
    name: "NPS Survey",
    description: "Measure how likely your users are to recommend you to others.",
    accent: "#D4A574",
    bg: "#FAF3EA",
    fields: [
      { label: "Score (0–10)", type: "rating" },
      { label: "What's the main reason?", type: "textarea", placeholder: "It saves me hours each week…" },
      { label: "Anything else?", type: "text", placeholder: "Optional feedback" },
    ],
  },
  {
    name: "Order Form",
    description: "Accept product or service orders with all the details you need.",
    accent: "#A07848",
    bg: "#EBE0D2",
    fields: [
      { label: "Product", type: "radio", options: ["Starter", "Pro", "Enterprise"] },
      { label: "Quantity", type: "text", placeholder: "1" },
      { label: "Delivery address", type: "textarea", placeholder: "123 Main St, City…" },
    ],
  },
];

function RatingMock({ accent }: { accent: string }) {
  return (
    <div className="flex items-center gap-1 py-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="w-5 h-5 rounded-sm"
          style={{
            background: i <= 3 ? accent : `${accent}30`,
            opacity: i <= 3 ? 1 : 0.5,
          }}
        />
      ))}
    </div>
  );
}

function RadioMock({ options, accent }: { options: string[]; accent: string }) {
  return (
    <div className="flex flex-col gap-1">
      {options.map((opt, i) => (
        <div key={opt} className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0"
            style={{ borderColor: accent }}
          >
            {i === 0 && (
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
            )}
          </div>
          <span className="text-[0.6rem]" style={{ color: `${accent}CC` }}>{opt}</span>
        </div>
      ))}
    </div>
  );
}

function TemplateCard({ name, description, fields, accent, bg }: Template) {
  return (
    <div className="group flex flex-col rounded-2xl border border-[#E8DDD0] bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-full">
      {/* Preview area */}
      <div className="px-5 pt-5 pb-4 flex flex-col gap-3" style={{ background: bg }}>
        {/* Form header bar */}
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-full" style={{ background: accent }} />
          <span
            className="text-[0.6rem] font-bold tracking-[0.16em] uppercase"
            style={{ color: accent }}
          >
            {name}
          </span>
        </div>

        {/* Field mocks */}
        {fields.map((field) => (
          <div key={field.label} className="flex flex-col gap-1">
            {/* Label */}
            <span className="text-[0.6rem] font-semibold" style={{ color: `${accent}BB` }}>
              {field.label}
            </span>

            {/* Input mock */}
            {field.type === "text" && (
              <div
                className="h-7 w-full rounded-md border px-2 flex items-center bg-white/80"
                style={{ borderColor: `${accent}40` }}
              >
                <span className="text-[0.6rem]" style={{ color: `${accent}60` }}>
                  {field.placeholder}
                </span>
              </div>
            )}
            {field.type === "textarea" && (
              <div
                className="h-10 w-full rounded-md border px-2 pt-1.5 bg-white/80"
                style={{ borderColor: `${accent}40` }}
              >
                <span className="text-[0.6rem]" style={{ color: `${accent}60` }}>
                  {field.placeholder}
                </span>
              </div>
            )}
            {field.type === "rating" && <RatingMock accent={accent} />}
            {field.type === "radio" && field.options && (
              <RadioMock options={field.options} accent={accent} />
            )}
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
