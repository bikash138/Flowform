import Image from "next/image";
import Link from "next/link";
import footerIllustration from "@/assets/footer.webp";
import { XIcon, GitHubIcon, LinkedInIcon } from "@/assets/icons";

const SOCIALS = [
  { label: "X (Twitter)", href: "https://x.com/Bikash__Shaw", icon: <XIcon /> },
  {
    label: "GitHub",
    href: "https://github.com/bikash138",
    icon: <GitHubIcon />,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/bikash-shaw-5ab74727b/",
    icon: <LinkedInIcon />,
  },
];

export function Footer() {
  return (
    <footer
      id="contact"
      className="bg-[#FDFAF6] overflow-hidden rounded-t-[2.5rem] border-t border-[#E8DDD0] mx-4"
    >
      <div className="flex flex-col items-center text-center px-6 pt-20 pb-10 gap-5">
        <h2 className="footer-heading text-3xl sm:text-4xl md:text-5xl text-[#1C1610] leading-tight max-w-2xl mb-0">
          The ones who show up,
          <br />
          <span className="relative inline-block text-[#C4956A] font-bold">
            find the way.
            <svg
              className="absolute left-0 w-full overflow-visible"
              style={{ bottom: "-6px" }}
              height="10"
              viewBox="0 0 200 10"
              preserveAspectRatio="none"
              fill="none"
              aria-hidden="true"
            >
              <path
                className="squiggle-line"
                d="M0,5 C14,1 28,9 42,5 C56,1 70,9 84,5 C98,1 112,9 126,5 C140,1 154,9 168,5 C182,1 196,9 200,5"
                stroke="#C4956A"
                strokeWidth="2.5"
                strokeLinecap="round"
                pathLength="1"
              />
            </svg>
          </span>
        </h2>

        <p className="text-[#5C4E40] text-base sm:text-lg max-w-md leading-relaxed">
          The simpler the path, the more people complete it.
        </p>

        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-[#1C1610] text-[#FDFAF6] hover:bg-[#2C2010] transition-colors duration-200 rounded-full px-7 py-3 text-sm font-semibold tracking-wide mt-1"
        >
          Get started for free
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="relative w-full">
        <Image
          src={footerIllustration}
          alt=""
          sizes="100vw"
          placeholder="blur"
          quality={75}
          className="w-full h-auto select-none pointer-events-none"
        />
        <div className="footer-illustration-fade absolute inset-0 pointer-events-none" />
      </div>

      <div className="border-t border-[#E8DDD0]">
        <div className="px-6 py-3 flex items-center justify-end gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 group leading-none"
          >
            <Image
              src="/logo.svg"
              alt="Flowform"
              width={18}
              height={18}
              className="shrink-0 transition-transform duration-200 group-hover:scale-105"
            />
            <span className="text-[#2B2B2B] font-bold text-sm tracking-wider leading-none">
              Flowform
            </span>
          </Link>

          <p className="text-xs text-[#B3A89E] font-medium leading-none mb-0">
            © {new Date().getFullYear()} flowform.in
          </p>

          <span className="w-px h-4 bg-[#E8DDD0]" />

          <div className="flex items-center gap-0.5">
            {SOCIALS.map(({ icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 flex items-center justify-center text-[#B3A89E] hover:text-[#A68A6D] transition-colors duration-150"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
