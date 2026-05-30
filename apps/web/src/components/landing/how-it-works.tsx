"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ImageIcon } from "lucide-react";
import { STEPS } from "@/data/how-it-works-steps";

const STEP_DURATION = 4000;

const RIGHT_H = 448;

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

        {/* MOBILE layout */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="lg:hidden flex flex-col gap-5"
          onMouseEnter={() => {
            paused.current = true;
          }}
          onMouseLeave={() => {
            paused.current = false;
          }}
        >
          <div className="flex flex-col gap-1">
            <motion.p
              key={active}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="text-sm font-semibold text-[#2B2B2B]"
            >
              {STEPS[active].title}
            </motion.p>
            <div className="h-[2px] w-full bg-[#E8DDD0] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#D9B38C] rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Large image */}
          <div style={{ height: 380 }}>
            <div className="w-full h-full rounded-2xl border border-[#E8DDD0] bg-[#F7F2EC] shadow-[0_8px_48px_rgba(43,43,43,0.07)] overflow-hidden flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#E8DDD0] flex items-center justify-center">
                <ImageIcon size={26} className="text-[#A68A6D]" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-[#A68A6D] font-medium">Your screenshot goes here</p>
            </div>
          </div>
        </motion.div>

        {/* DESKTOP layout */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="hidden lg:flex gap-16 items-start"
          onMouseEnter={() => {
            paused.current = true;
          }}
          onMouseLeave={() => {
            paused.current = false;
          }}
        >
          <div className="w-[38%] shrink-0 flex flex-col gap-1.5">
            {STEPS.map(({ number, title, description }, i) => (
              <button
                key={number}
                onClick={() => handleStepClick(i)}
                className="text-left flex gap-4"
              >
                <div className="w-0.5 self-stretch rounded-full overflow-hidden relative bg-[#E8DDD0] shrink-0">
                  <motion.div
                    className="absolute top-0 left-0 w-full bg-[#D9B38C] rounded-full"
                    style={{ height: `${segmentFill(i)}%` }}
                  />
                </div>

                <div className="flex-1 py-3">
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
                  <motion.div
                    initial={false}
                    animate={{
                      height: active === i ? "auto" : 0,
                      opacity: active === i ? 1 : 0,
                    }}
                    transition={{
                      duration: 0.4,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    style={{ overflow: "hidden" }}
                  >
                    <p className="text-sm text-[#6B6256] leading-relaxed mt-1.5">
                      {description}
                    </p>
                  </motion.div>
                </div>
              </button>
            ))}
          </div>

          {/* Right: image */}
          <div className="flex-1" style={{ height: RIGHT_H }}>
            <div className="w-full h-full rounded-2xl border border-[#E8DDD0] bg-[#F7F2EC] shadow-[0_8px_48px_rgba(43,43,43,0.07)] overflow-hidden flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#E8DDD0] flex items-center justify-center">
                <ImageIcon size={26} className="text-[#A68A6D]" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-[#A68A6D] font-medium">Your screenshot goes here</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
