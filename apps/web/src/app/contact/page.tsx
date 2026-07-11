import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/legal/info-page";

export const metadata = {
  title: "Contact — Flowform",
  description:
    "Questions, feedback, or something broken? Here's how to reach the people who build Flowform.",
};

// TODO: point this at the real inbox before launch.
const SUPPORT_EMAIL = "hello@flowform.in";

const SOCIALS = [
  { label: "X (Twitter)", href: "https://x.com/Bikash__Shaw" },
  { label: "GitHub", href: "https://github.com/bikash138" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/bikash-shaw-5ab74727b/" },
];

const linkClass =
  "font-semibold text-[#A68A6D] underline underline-offset-4 transition-colors hover:text-[#92683A]";

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="Contact"
      title="Talk to the people who build it."
      intro="No ticket queues and no bots. Send a note and someone who actually works on Flowform will read it."
    >
      <InfoSection title="Email us">
        <p>
          The best way to reach us for anything — a question about your plan, a
          bug you have run into, or a feature you wish existed.
        </p>
        <p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className={linkClass}>
            {SUPPORT_EMAIL}
          </a>
        </p>
      </InfoSection>

      <InfoSection title="Check the FAQ first">
        <p>
          Plans, response limits, custom branding and billing are all answered
          on the{" "}
          <Link href="/#faq" className={linkClass}>
            frequently asked questions
          </Link>
          . You will probably get your answer faster there than waiting on us.
        </p>
      </InfoSection>

      <InfoSection title="Security issues">
        <p>
          If you have found a vulnerability, please report it privately rather
          than opening a public issue. Our{" "}
          <Link href="/security" className={linkClass}>
            disclosure policy
          </Link>{" "}
          explains how we handle reports and how we credit the people who send
          them.
        </p>
      </InfoSection>

      <InfoSection title="Elsewhere">
        <p>
          You can also find us on{" "}
          {SOCIALS.map(({ label, href }, i) => (
            <span key={label}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {label}
              </a>
              {i < SOCIALS.length - 2 ? ", " : null}
              {i === SOCIALS.length - 2 ? " and " : null}
            </span>
          ))}
          .
        </p>
      </InfoSection>
    </InfoPage>
  );
}
