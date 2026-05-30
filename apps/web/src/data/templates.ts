export type Shape = "landscape" | "squarish" | "oval" | "circle" | "tall" | "rounded";

export type Template = {
  name: string;
  image: string | null;
  shape: Shape;
  accent: string;
  bg: string;
};

export const LEFT_TEMPLATES: Template[] = [
  { name: "Contact Form",        image: null, accent: "#D9B38C", bg: "#FAF7F0", shape: "landscape" },
  { name: "Event Registration",  image: null, accent: "#8B6D4E", bg: "#EDE0D0", shape: "oval"      },
  { name: "Product Survey",      image: null, accent: "#B8925A", bg: "#F2E8DA", shape: "squarish"  },
  { name: "NPS Survey",          image: null, accent: "#D4A574", bg: "#FAF3EA", shape: "circle"    },
  { name: "Bug Report",          image: null, accent: "#C8A882", bg: "#FBF6EE", shape: "landscape" },
  { name: "Quiz / Assessment",   image: null, accent: "#DDB88A", bg: "#FEFAF5", shape: "tall"      },
  { name: "Appointment Booking", image: null, accent: "#BC9070", bg: "#F8F2E8", shape: "rounded"   },
  { name: "Partner Inquiry",     image: null, accent: "#D0A875", bg: "#FAEEE0", shape: "oval"      },
  { name: "Scholarship Form",    image: null, accent: "#A07848", bg: "#EBE0D2", shape: "squarish"  },
  { name: "Return Request",      image: null, accent: "#967055", bg: "#F0E6D8", shape: "landscape" },
];

export const RIGHT_TEMPLATES: Template[] = [
  { name: "Customer Feedback",   image: null, accent: "#A68A6D", bg: "#F5EDE0", shape: "squarish"  },
  { name: "Job Application",     image: null, accent: "#C49A6C", bg: "#F7F0E6", shape: "tall"      },
  { name: "Lead Capture",        image: null, accent: "#9E7A55", bg: "#EDE3D8", shape: "circle"    },
  { name: "Order Form",          image: null, accent: "#A07848", bg: "#EBE0D2", shape: "landscape" },
  { name: "Newsletter Signup",   image: null, accent: "#7A5C3C", bg: "#E8DCCF", shape: "oval"      },
  { name: "Waitlist",            image: null, accent: "#967055", bg: "#F0E6D8", shape: "rounded"   },
  { name: "User Onboarding",     image: null, accent: "#885A3A", bg: "#E5D8C8", shape: "squarish"  },
  { name: "Vendor Registration", image: null, accent: "#D9B38C", bg: "#FAF7F0", shape: "landscape" },
  { name: "Support Ticket",      image: null, accent: "#B8925A", bg: "#F2E8DA", shape: "oval"      },
  { name: "Employee Survey",     image: null, accent: "#C8A882", bg: "#FBF6EE", shape: "circle"    },
];
