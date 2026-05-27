"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Templates", href: "#templates" },
  { label: "Explore", href: "/explore" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-500 ease-in-out",
        scrolled ? "px-8 pt-2" : "px-4 pt-4",
      ].join(" ")}
    >
      <nav
        className={[
          "border transition-all duration-500 ease-in-out",
          scrolled
            ? "w-full max-w-3xl rounded-2xl bg-[#17120D]/90 border-[#D9B38C]/15 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl"
            : "w-full max-w-5xl rounded-2xl bg-[#17120D]/75 border-[#D9B38C]/10 shadow-[0_2px_12px_rgba(0,0,0,0.2)] backdrop-blur-xl",
        ].join(" ")}
      >
        {/* Main bar */}
        <div className={`flex items-center justify-between transition-all duration-500 ease-in-out ${scrolled ? "px-4 py-2" : "px-5 py-3"}`}>
          {/* Branding */}
          <Link
            href="/"
            className="flex items-center gap-1.5 shrink-0 group"
            aria-label="Flowform home"
          >
            <Image
              src="/logo.svg"
              alt="Flowform logo"
              width={34}
              height={34}
              className="transition-transform duration-200 group-hover:scale-105 brightness-0 invert shrink-0"
            />
            <span
              className={[
                "text-white font-bold text-[1.05rem] tracking-tight leading-none overflow-hidden whitespace-nowrap",
                "transition-all duration-500 ease-in-out",
                scrolled
                  ? "max-w-0 opacity-0 -translate-x-3"
                  : "max-w-[120px] opacity-100 translate-x-0",
              ].join(" ")}
            >
              Flowform
            </span>
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={[
                    "px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors duration-150",
                    "text-white hover:text-[#D9B38C] hover:bg-white/5",
                    link.label === "Pricing" ? "text-[#D9B38C]" : "",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Sign in — desktop only */}
            <Link
              href="/signin"
              className={[
                "hidden md:inline-flex items-center px-3.5 py-1.5 text-sm font-bold text-white hover:text-[#D9B38C] hover:bg-white/5 rounded-lg overflow-hidden whitespace-nowrap",
                "transition-all duration-500 ease-in-out",
                scrolled ? "max-w-0 opacity-0 px-0" : "max-w-[80px] opacity-100",
              ].join(" ")}
            >
              Sign in
            </Link>

            {/* Get Started CTA */}
            <Link
              href="/signup"
              className="hidden md:inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-[#D9B38C] text-[#17120D] hover:bg-[#C9A37C] active:scale-[0.97] transition-all duration-150 shadow-sm"
            >
              Get Started
            </Link>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-[#D9B38C] hover:bg-white/8 transition-colors duration-150"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <X size={20} strokeWidth={2} />
              ) : (
                <Menu size={20} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <div
          className={[
            "md:hidden overflow-hidden transition-all duration-250 ease-in-out",
            menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
          ].join(" ")}
          aria-hidden={!menuOpen}
        >
          <div className="border-t border-[#D9B38C]/10 px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={[
                  "px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                  "text-white hover:text-[#D9B38C] hover:bg-white/5",
                  link.label === "Pricing" ? "text-[#D9B38C]" : "",
                ].join(" ")}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-[#D9B38C]/10 mt-2 pt-3 flex flex-col gap-2">
              <Link
                href="/signin"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-semibold text-white hover:text-[#D9B38C] hover:bg-white/5 transition-colors duration-150"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-center bg-[#D9B38C] text-[#17120D] hover:bg-[#C9A37C] transition-colors duration-150"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
