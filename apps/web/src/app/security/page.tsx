import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/legal/info-page";

export const metadata = {
  title: "Privacy & Security — Flowform",
  description:
    "How Flowform protects your account, your workspaces, and the responses people trust you with.",
};

/**
 * Every claim here maps to something actually implemented. Nothing asserts a
 * certification or audit we don't hold — if a control changes in the codebase,
 * change it here too.
 */
export default function SecurityPage() {
  return (
    <InfoPage
      eyebrow="Privacy & Security"
      title="Your data, handled with care."
      intro="People fill in your forms because they trust you. Here is exactly what we do — and do not do — with what they leave behind."
      lastUpdated="July 2026"
    >
      <InfoSection title="What we collect">
        <p>
          When you sign in with Google we receive your name, email address, and
          profile picture. That is the entire account record. We also store the
          forms you build, the responses people submit to them, and any files
          uploaded through those forms.
        </p>
        <p>
          Alongside that we keep basic request metadata — an IP address and
          browser user agent — used only to rate limit abuse. We do not sell
          your data, and we do not use the responses collected through your
          forms for anything beyond showing them to you. Delete a form and its
          responses go with it.
        </p>
      </InfoSection>

      <InfoSection title="We never see your password">
        <p>
          Flowform has no password field. Sign-in goes entirely through Google,
          so your credentials are only ever handled by Google — we receive an
          identity, never a secret.
        </p>
        <p>
          This is a deliberate trade. There is no password for us to store, no
          password database to leak, and nothing for an attacker to
          brute-force.
        </p>
      </InfoSection>

      <InfoSection title="Sessions">
        <p>
          Your session lives in an httpOnly cookie, so no script running on the
          page can read it. In production it is marked Secure, meaning it is
          only ever sent over HTTPS, and SameSite=Lax, which stops other sites
          from riding your session on your behalf.
        </p>
        <p>
          Sessions expire after seven days and are stored server-side rather
          than in the cookie itself, so signing out revokes them immediately
          rather than merely forgetting them in your browser.
        </p>
      </InfoSection>

      <InfoSection title="Permissions and isolation">
        <p>
          Workspaces use four roles — Owner, Admin, Editor and Viewer — each
          mapped to an explicit list of permissions. Those checks run on the
          server for every request, not just in the interface. Hiding a button
          is not access control, so we do not rely on it.
        </p>
        <p>
          Every request that touches a workspace re-verifies that you are a
          member of it before returning anything. Knowing a workspace or form ID
          is not enough to read it.
        </p>
      </InfoSection>

      <InfoSection title="Who can see a form">
        <p>
          Each form is public, unlisted, or password-protected. A
          password-protected form cannot be published without an access code —
          the database itself enforces that, so the protection cannot be lost to
          a bug in the interface above it.
        </p>
      </InfoSection>

      <InfoSection title="Abuse and rate limiting">
        <p>
          Sign-in attempts and API traffic are throttled, backed by Redis so the
          limits hold across every server instance rather than per-process. When
          you are throttled we tell you exactly how long to wait rather than
          failing silently.
        </p>
      </InfoSection>

      <InfoSection title="Reporting a vulnerability">
        <p>
          If you believe you have found a security issue, please tell us before
          you tell anyone else. Report it privately and we will confirm receipt,
          keep you updated while we fix it, and credit you if you would like us
          to.
        </p>
        <p>
          <Link
            href="/contact"
            className="font-semibold text-[#A68A6D] underline underline-offset-4 transition-colors hover:text-[#92683A]"
          >
            Get in touch
          </Link>{" "}
          — please do not open a public issue for anything security-related.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
