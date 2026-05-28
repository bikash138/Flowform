"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { NAV_MENUS, type ColItems, type ColImage } from "@/data/navbar-menus";
import meImage from "@/assets/me.webp";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isPricing, setIsPricing] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 0);
      const darkSection = document.getElementById("builder");
      if (darkSection) {
        const rect = darkSection.getBoundingClientRect();
        setIsDark(rect.top <= 64 && rect.bottom > 64);
      }
      const proCard = document.getElementById("pricing-pro-card");
      if (proCard) {
        const rect = proCard.getBoundingClientRect();
        setIsPricing(rect.top <= 64 && rect.bottom > 64);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dark = isDark || isPricing;

  const theme = dark
    ? {
        logo:        "text-nav-cream",
        logoFilter:  "brightness-0 invert",
        link:        "text-white/80 hover:text-white hover:bg-white/10",
        trigger:     "text-white/80 hover:text-white bg-transparent hover:bg-nav-ink/40 data-open:bg-nav-ink/40",
        signIn:      "text-white/80 hover:text-white hover:bg-white/10",
        cta:         "bg-nav-cream text-nav-ink-deep hover:bg-white",
        hamburger:   "text-white hover:bg-white/10",
      }
    : {
        logo:        "text-nav-ink",
        logoFilter:  "",
        link:        "text-nav-ink/80 hover:text-nav-ink hover:bg-black/5",
        trigger:     "text-nav-ink/80 hover:text-nav-ink bg-transparent hover:bg-nav-ink/10 data-open:bg-nav-ink/10",
        signIn:      "text-nav-ink/80 hover:text-nav-ink hover:bg-black/5",
        cta:         "bg-nav-ink text-nav-cream hover:bg-nav-ink-hover",
        hamburger:   "text-nav-ink hover:bg-black/5",
      };

  const glassBg = !scrolled
    ? "bg-transparent"
    : isDark
      ? "bg-nav-ink-deep/60 backdrop-blur-md shadow-sm"
      : "bg-white/20 backdrop-blur-md shadow-sm";

  const dropdownBg =
    "bg-nav-ink/50 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl";

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div
        aria-hidden
        className={`absolute inset-0 pointer-events-none transition-all duration-300 ${glassBg}`}
      />
      <nav className="relative flex items-center justify-between px-8 py-2">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group" aria-label="Flowform home">
          <Image
            src="/logo.svg"
            alt="Flowform logo"
            width={36}
            height={36}
            className={`transition-all duration-300 group-hover:scale-105 shrink-0 ${theme.logoFilter}`}
          />
          <span className={`font-bold text-2xl tracking-wider transition-colors duration-300 ${theme.logo}`}>
            Flowform
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2">
          <NavigationMenu>
            <NavigationMenuList>
              {(Object.keys(NAV_MENUS) as Array<keyof typeof NAV_MENUS>).map((label) => (
                <NavigationMenuItem key={label}>
                  <NavigationMenuTrigger
                    className={`cursor-pointer text-base font-medium transition-colors duration-150 ${theme.trigger}`}
                  >
                    {label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className={`${dropdownBg} p-7 w-[580px] min-h-[260px] flex`}>

                      {/* Left column */}
                      <DropdownCol col={NAV_MENUS[label].left} />

                      <div className="w-px bg-white/10 mx-4 self-stretch" />

                      {/* Right column — items or image */}
                      {"image" in NAV_MENUS[label].right ? (
                        <div className="flex-1 flex items-stretch">
                          <Link
                            href={(NAV_MENUS[label].right as ColImage).image.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative w-full rounded-xl overflow-hidden block"
                          >
                            <Image
                              src={meImage}
                              alt="Creator"
                              fill
                              quality={90}
                              sizes="230px"
                              placeholder="blur"
                              className="object-cover object-top"
                            />
                          </Link>
                        </div>
                      ) : (
                        <DropdownCol col={NAV_MENUS[label].right as ColItems} />
                      )}

                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/signin"
            className={`px-6 py-2.5 rounded-lg text-base font-medium transition-colors duration-150 ${theme.signIn}`}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className={`px-6 py-2.5 rounded-xl text-base font-semibold active:scale-[0.97] transition-all duration-150 shadow-sm ${theme.cta}`}
          >
            Get started
          </Link>
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className={`md:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors duration-150 ${theme.hamburger}`}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={[
          "md:hidden mx-3 mb-3 rounded-2xl overflow-hidden transition-all duration-250 ease-in-out",
          "bg-nav-ink/50 backdrop-blur-2xl border border-white/10",
          menuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <div className="px-6 py-3 flex flex-col gap-1">
          {["Features", "Explore", "Pricing", "Contact"].map((label) => (
            <Link
              key={label}
              href={label === "Features" ? "#features" : label === "Explore" ? "/explore" : `#${label.toLowerCase()}`}
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-center text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-150"
            >
              {label}
            </Link>
          ))}
          <div className="border-t border-white/10 mt-2 pt-3 flex flex-col gap-2">
            <Link
              href="/signin"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-center text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-150"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={() => setMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-center bg-nav-cream text-nav-ink-deep hover:bg-white transition-colors duration-150"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function DropdownCol({ col }: { col: ColItems }) {
  return (
    <div className="flex-1">
      <p className="text-[0.65rem] font-semibold tracking-widest uppercase text-white/40 mb-3">
        {col.heading}
      </p>
      <ul className="flex flex-col gap-2">
        {col.items.map((item) => (
          <li key={item.label}>
            <NavigationMenuLink asChild>
              <Link
                href={item.href}
                className="block px-3 py-2 rounded-xl hover:bg-white/8 transition-colors duration-150 group"
              >
                <p className="m-0 text-base font-semibold text-white/90 group-hover:text-white leading-none">
                  {item.label}
                </p>
                <p className="m-0 mt-1 text-sm text-white/75 leading-none">
                  {item.desc}
                </p>
              </Link>
            </NavigationMenuLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
