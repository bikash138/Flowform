export type NavItem = { label: string; desc: string; href: string };
export type ColItems = { heading: string; items: NavItem[] };
export type ColImage = { image: { src: string; href: string } };
export type NavMenu = { left: ColItems; right: ColItems | ColImage };

export const NAV_MENUS: Record<string, NavMenu> = {
  Features: {
    left: {
      heading: "Create",
      items: [
        { label: "Forms", desc: "Build beautiful contact and lead forms", href: "/explore" },
        { label: "Surveys", desc: "Surveys with conditional logic", href: "/explore" },
        { label: "Quizzes", desc: "Real time quizzes", href: "/explore" },
      ],
    },
    right: {
      heading: "Analyze",
      items: [
        { label: "Analytics", desc: "Real-time response insights and charts", href: "#features" },
        { label: "Templates", desc: "Ready-to-use form templates", href: "#templates" },
        { label: "Integrations", desc: "Connect your favorite tools", href: "#features" },
      ],
    },
  },
  Explore: {
    left: {
      heading: "Discover",
      items: [
        { label: "Template Gallery", desc: "Browse 50+ ready-to-use templates", href: "/explore" },
        { label: "Popular Forms", desc: "See what others are building", href: "/explore" },
        { label: "New Arrivals", desc: "Fresh templates added weekly", href: "/explore" },
      ],
    },
    right: {
      heading: "By Type",
      items: [
        { label: "Contact Forms", desc: "Capture leads and inquiries", href: "/explore" },
        { label: "Feedback Surveys", desc: "Understand your audience", href: "/explore" },
        { label: "Registration Forms", desc: "Events, signups and more", href: "/explore" },
      ],
    },
  },
  Pricing: {
    left: {
      heading: "Plans",
      items: [
        { label: "Free", desc: "Nice for hobbies", href: "#pricing" },
        { label: "Pro — $10/mo", desc: "Built for small teams", href: "#pricing" },
        { label: "Pro Max — $25/mo", desc: "Made for serious brands", href: "#pricing" },
      ],
    },
    right: {
      heading: "More",
      items: [
        { label: "Compare Plans", desc: "See what's included in each tier", href: "#pricing" },
        { label: "FAQ", desc: "Common questions answered", href: "#faq" },
      ],
    },
  },
  Contact: {
    left: {
      heading: "Connect",
      items: [
        { label: "X", desc: "Chill Place", href: "https://x.com/" },
        { label: "GitHub", desc: "Explore my work", href: "https://github.com/" },
        { label: "LinkedIn", desc: "Connect with me professionally", href: "https://linkedin.com/" },
      ],
    },
    right: {
      image: { src: "/me.webp", href: "https://www.bikashshaw.in" },
    },
  },
};
