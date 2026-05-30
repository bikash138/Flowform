"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Minus } from "lucide-react";
import { FAQS } from "@/data/faqs";

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#E8DDD0] last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-[#2B2B2B] group-hover:text-[#A68A6D] transition-colors duration-150 leading-snug">
          {q}
        </span>
        <span className="shrink-0 w-7 h-7 rounded-full border border-[#E8DDD0] flex items-center justify-center text-[#A68A6D] group-hover:border-[#D9B38C] transition-colors duration-150">
          {open
            ? <Minus size={13} strokeWidth={2.5} />
            : <Plus size={13} strokeWidth={2.5} />
          }
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${open ? "max-h-48 pb-5" : "max-h-0"}`}
      >
        <p className="text-sm text-[#6B6256] leading-relaxed mb-0">{a}</p>
      </div>
    </div>
  );
}

export function FAQ() {
  return (
    <section id="faq" className="bg-[#FDFAF6] px-6 pt-24 pb-28">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#A68A6D] block mb-4">
            FAQ
          </span>
          <h2
            className="font-bold text-[#2B2B2B] leading-[1.1] mb-4"
            style={{ fontSize: "clamp(1.9rem, 3.5vw, 2.6rem)" }}
          >
            Common questions.
          </h2>
          <p className="text-[#6B6256] text-base mb-0">
            If you don&apos;t see your question,{" "}
            <Link href="#contact" className="text-[#A68A6D] font-semibold hover:text-[#8B6D4E] transition-colors">
              get in touch.
            </Link>
          </p>
        </div>

        {/* Accordion */}
        <div className="rounded-2xl border border-[#E8DDD0] bg-white px-6 shadow-sm">
          {FAQS.map((item) => (
            <FAQItem key={item.q} {...item} />
          ))}
        </div>

        {/* Bottom CTA */}
        <p className="text-center text-sm text-[#9E8E7E] mt-8">
          Still wondering?{" "}
          <Link href="#contact" className="text-[#A68A6D] font-semibold hover:text-[#8B6D4E] transition-colors underline underline-offset-2">
            Send us a question.
          </Link>
        </p>
      </div>
    </section>
  );
}
