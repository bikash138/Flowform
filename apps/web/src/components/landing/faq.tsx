"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Minus } from "lucide-react";

const FAQS = [
  {
    q: "Is Flowform really free to start?",
    a: "Yes. You can sign up, build forms, and start collecting responses without entering a credit card. The free plan includes up to 100 responses per month and 3 active forms.",
  },
  {
    q: "What happens when I hit the 100 response limit?",
    a: "You'll receive a notification as you approach your limit. Existing responses are always safe — you just won't collect new ones until the next month or until you upgrade to Pro.",
  },
  {
    q: "Can I use my own branding on forms?",
    a: "On the Pro plan, yes. You can add your own branded navbar, custom colors, custom slug, and remove all Flowform branding so your respondents only see your identity.",
  },
  {
    q: "What is a custom slug?",
    a: "Instead of a random ID in the URL, a custom slug lets you set a readable link like flowform.in/f/your-brand — making your forms look more professional when shared.",
  },
  {
    q: "Does Flowform support multiple languages?",
    a: "Yes, on the Pro plan. You can configure your form to display in different languages to reach a wider audience without creating separate forms.",
  },
  {
    q: "Can I add images to my forms?",
    a: "Pro users can upload custom images directly into their forms — useful for product feedback forms, visual surveys, or adding context to specific questions.",
  },
  {
    q: "How do I export my responses?",
    a: "You can export all responses as CSV or JSON from your response dashboard at any time. Pro users also get access to advanced analytics within the platform.",
  },
  {
    q: "Can I cancel my Pro subscription anytime?",
    a: "Absolutely. There are no long-term commitments. Cancel whenever you want and you'll retain Pro access until the end of your billing period.",
  },
];

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
