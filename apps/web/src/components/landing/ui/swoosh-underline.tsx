"use client";

import { motion } from "framer-motion";

export function SwooshUnderline() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 320 20"
      preserveAspectRatio="none"
      className="absolute left-0 w-full"
      style={{ bottom: "-10px", height: "20px" }}
    >
      <defs>
        <clipPath id="swoosh-reveal">
          <motion.rect
            x="0" y="0" height="20"
            initial={{ width: 0 }}
            animate={{ width: 320 }}
            transition={{ duration: 0.9, delay: 0.4, ease: "easeInOut" }}
          />
        </clipPath>
      </defs>
      <path
        d="M2,16 Q80,2 160,10 Q240,18 318,8 Q240,22 160,18 Q80,14 2,16 Z"
        style={{ fill: "var(--hero-accent)" }}
        opacity="0.6"
        clipPath="url(#swoosh-reveal)"
      />
    </svg>
  );
}
