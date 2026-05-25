import type { PlanId } from "@flowform/database/constants";

export type PlanFeatureItem = {
  label: string;
  description: string;
};

export type PlanFeatureGroup = {
  value: string;
  label: string;
  items: readonly PlanFeatureItem[];
};

export type PlanData = {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: readonly PlanFeatureGroup[];
};

export const PLANS: readonly PlanData[] = [
  {
    id: "PRO",
    name: "Pro",
    price: "$10",
    period: "/month",
    tagline: "For individuals and small teams.",
    features: [
      {
        value: "general",
        label: "General",
        items: [
          {
            label: "Everything in Free",
            description: "All features from the Free plan are included.",
          },
          {
            label: "2,000 responses / month",
            description: "Collect up to 2,000 form responses every month. Resets on the 1st of each month.",
          },
          {
            label: "20 active forms",
            description: "Create and manage up to 20 active forms in your workspace at the same time.",
          },
          {
            label: "10 team members",
            description: "Invite up to 10 collaborators to your workspace to build and manage forms together.",
          },
          {
            label: "Premium themes",
            description: "Access premium form themes exclusively available on the Pro plan.",
          },
          {
            label: "Custom slug URL",
            description: "Replace the auto-generated URL with a clean, memorable link like /my-survey.",
          },
          {
            label: "Custom branded navbar",
            description: "Apply your brand colors and logo to the form navbar for a native experience.",
          },
          {
            label: "Multi-language forms",
            description: "Publish your form in multiple languages and let respondents switch to their preferred language.",
          },
          {
            label: "Custom form close date",
            description: "Schedule your form to automatically stop accepting responses on a specific date and time.",
          },
          {
            label: "Advanced analytics",
            description: "View drop-off rates, completion rates, field-level insights, and response trends over time.",
          },
        ],
      },
    ],
  },
  {
    id: "PRO_MAX",
    name: "Pro Max",
    price: "$25",
    period: "/month",
    tagline: "For brands that want full control.",
    features: [
      {
        value: "general",
        label: "General",
        items: [
          {
            label: "10,000 responses / month",
            description: "Collect up to 10,000 form responses every month.",
          },
          {
            label: "50 active forms",
            description: "Create and manage up to 50 active forms in your workspace.",
          },
          {
            label: "30 team members",
            description: "Invite up to 30 collaborators to your workspace.",
          },
          {
            label: "Exclusive Pro Max themes",
            description: "Access Pro Max exclusive themes — Obsidian, Rose Gold, and Deep Forest.",
          },
          {
            label: "Remove Flowform watermark",
            description: "Hide the Powered by Flowform badge for a fully white-labeled experience.",
          },
          {
            label: "Redirect on completion",
            description: "Automatically send respondents to a custom URL after they submit the form.",
          },
          {
            label: "Email confirmation to respondents",
            description: "Send an automatic confirmation email to each respondent immediately after they submit.",
          },
          {
            label: "Custom email theme & branding",
            description: "Customize confirmation emails with your own subject line, message, and brand styling.",
          },
        ],
      },
    ],
  },
];
