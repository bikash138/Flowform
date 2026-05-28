"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ImageIcon } from "lucide-react";

const STEP_DURATION = 4000;

const STEPS = [
  {
    number: "01",
    title: "Create Workspace",
    description:
      "Set up your workspace in seconds. Invite your team, organize forms by project, and keep everything in one place.",
  },
  {
    number: "02",
    title: "Create Forms",
    description:
      "Build from scratch or pick a template. Drag and drop fields, add conditional logic, and customize every detail — no code needed.",
  },
  {
    number: "03",
    title: "Add Branding & Share",
    description:
      "Add your logo, set your colors, and remove the Flowform badge. Share via link, embed on your site, or send by email.",
  },
  {
    number: "04",
    title: "Real-time Analytics",
    description:
      "Watch responses land in your dashboard the moment they're submitted. Track completion rates, spot trends, and export anytime.",
  },
];

// Fixed heights so nothing shifts layout
const LEFT_H = 400; // px — left steps column
const RIGHT_H = LEFT_H + 48; // slightly taller to account for browser chrome

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  const paused = useRef(false);
  const stepRef = useRef(0);
  const progressRef = useRef(0);

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView) return;

    const TICK = 50;
    const id = setInterval(() => {
      if (paused.current) return;

      progressRef.current += (TICK / STEP_DURATION) * 100;
      if (progressRef.current >= 100) {
        progressRef.current = 0;
        stepRef.current = (stepRef.current + 1) % STEPS.length;
        setActive(stepRef.current);
      }
      setProgress(progressRef.current);
    }, TICK);

    return () => clearInterval(id);
  }, [inView]);

  const handleStepClick = (i: number) => {
    stepRef.current = i;
    progressRef.current = 0;
    setActive(i);
    setProgress(0);
  };

  const segmentFill = (i: number) =>
    i < active ? 100 : i === active ? progress : 0;

  return (
    <section className="bg-[#FDFAF6] px-6 pt-8 pb-20">
      <div className="max-w-5xl mx-auto" ref={ref}>

        {/* Header */}
        <div className="text-center mb-14">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
            className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#A68A6D]"
          >
            How it works
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[#2B2B2B] font-bold leading-[1.1] mt-3"
            style={{ fontSize: "clamp(1.9rem, 3.5vw, 2.6rem)" }}
          >
            From idea to live form
            <br />
            in 4 steps.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[#6B6256] text-base leading-relaxed mt-3 max-w-md mx-auto"
          >
            No tutorials. No code. Just your questions and a link.
          </motion.p>
        </div>

        {/* Main layout — fixed height on desktop so nothing below shifts */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-stretch"
          onMouseEnter={() => { paused.current = true; }}
          onMouseLeave={() => { paused.current = false; }}
        >

          {/* ── Left: vertical progress bar + steps ── */}
          <div
            className="w-full lg:w-[38%] flex gap-5 shrink-0"
            style={{ height: LEFT_H }}
          >
            {/* Vertical bar — 4 segments with gaps */}
            <div
              className="flex flex-col shrink-0"
              style={{ width: 2, height: LEFT_H, gap: 6 }}
            >
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 relative bg-[#E8DDD0] rounded-full overflow-hidden"
                >
                  <motion.div
                    className="absolute top-0 left-0 w-full bg-[#D9B38C] rounded-full"
                    style={{ height: `${segmentFill(i)}%` }}
                  />
                </div>
              ))}
            </div>

            {/* Steps — each gets exactly 25% of fixed height, no layout shift */}
            <div className="flex flex-col flex-1">
              {STEPS.map(({ number, title, description }, i) => (
                <button
                  key={number}
                  onClick={() => handleStepClick(i)}
                  className="text-left flex-1 flex flex-col justify-center group"
                >
                  <span
                    className="text-[0.6rem] font-bold tracking-[0.14em] uppercase transition-colors duration-300"
                    style={{ color: active === i ? "#A68A6D" : "#D9C9B8" }}
                  >
                    {number}
                  </span>

                  <h3
                    className="font-bold text-[1.05rem] leading-snug mt-0.5 transition-colors duration-300"
                    style={{ color: active === i ? "#2B2B2B" : "#C4B5A5" }}
                  >
                    {title}
                  </h3>

                  {/* Always in DOM — opacity only, zero layout shift */}
                  <motion.p
                    animate={{ opacity: active === i ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="text-sm text-[#6B6256] leading-relaxed mt-1.5 line-clamp-2"
                  >
                    {description}
                  </motion.p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Right: larger image placeholder ── */}
          <div className="flex-1 w-full" style={{ height: RIGHT_H }}>
            <div className="w-full h-full rounded-2xl border border-[#E8DDD0] bg-white shadow-[0_8px_48px_rgba(43,43,43,0.07)] overflow-hidden flex flex-col">

              {/* Browser chrome */}
              <div className="px-4 py-3 border-b border-[#F0E8DE] flex items-center gap-2.5 bg-[#FDFAF6] shrink-0">
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                </div>
                <div className="flex-1 h-6 rounded-md bg-white border border-[#E8DDD0] flex items-center px-3">
                  <span className="text-[0.6rem] text-[#A68A6D] font-medium">
                    app.flowform.io
                  </span>
                </div>
              </div>

              {/* Image area — fills remaining height */}
              <div className="flex-1 bg-[#F7F2EC] flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#E8DDD0] flex items-center justify-center">
                  <ImageIcon size={26} className="text-[#A68A6D]" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-[#A68A6D] font-medium">
                  Your screenshot goes here
                </p>
              </div>

            </div>
          </div>

        </motion.div>
      </div>
    </section>
  );
}
