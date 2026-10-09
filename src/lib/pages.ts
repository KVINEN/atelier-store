// Client services, house and legal pages, rendered by `app/(info)/[page]`.
// Placeholder copy for the first iteration; replace with approved content.

import type { InquiryField } from "@/components/inquiry-form";

export type InfoSection = { heading: string; body: string[] };

export type InfoPage = {
  title: string;
  eyebrow: string;
  intro: string;
  sections?: InfoSection[];
  /** Question-and-answer pairs, rendered as disclosures. */
  faq?: { question: string; answer: string }[];
  form?: { fields: InquiryField[]; submitLabel: string; successMessage: string };
  /** Extra blocks with their own layout. */
  extra?: "stores" | "size-guide";
  links?: { label: string; href: string }[];
};

export const CLIENT_SERVICES = {
  phone: "+1 (212) 555-0142",
  email: "clientservices@atelier.example",
  hours: "Monday to Saturday, 9am–7pm ET",
};

export const stores = [
  {
    city: "New York",
    name: "Atelier Madison Avenue",
    address: ["790 Madison Avenue", "New York, NY 10065"],
    hours: "Mon–Sat 10am–7pm · Sun 12pm–6pm",
    phone: "+1 (212) 555-0170",
  },
  {
    city: "Los Angeles",
    name: "Atelier Rodeo Drive",
    address: ["340 North Rodeo Drive", "Beverly Hills, CA 90210"],
    hours: "Mon–Sat 10am–7pm · Sun 11am–6pm",
    phone: "+1 (310) 555-0118",
  },
  {
    city: "Chicago",
    name: "Atelier Oak Street",
    address: ["58 East Oak Street", "Chicago, IL 60611"],
    hours: "Mon–Sat 10am–6pm · Sun 12pm–5pm",
    phone: "+1 (312) 555-0193",
  },
];

export const sizeGuide = {
  clothing: {
    caption: "Women's ready-to-wear",
    head: ["Atelier", "US", "UK", "EU", "IT", "Bust (cm)", "Waist (cm)"],
    rows: [
      ["XS", "2", "6", "34", "38", "80–83", "62–65"],
      ["S", "4", "8", "36", "40", "84–87", "66–69"],
      ["M", "6", "10", "38", "42", "88–91", "70–73"],
      ["L", "8", "12", "40", "44", "92–96", "74–78"],
      ["XL", "10", "14", "42", "46", "97–101", "79–83"],
    ],
  },
  menswear: {
    caption: "Men's ready-to-wear",
    head: ["Atelier", "US / UK", "EU / IT", "Chest (cm)", "Waist (cm)"],
    rows: [
      ["S", "36", "46", "90–94", "76–80"],
      ["M", "38", "48", "95–99", "81–85"],
      ["L", "40", "50", "100–104", "86–90"],
      ["XL", "42", "52", "105–109", "91–95"],
    ],
  },
  shoes: {
    caption: "Shoes",
    head: ["EU", "US women", "US men", "UK", "Foot length (cm)"],
    rows: [
      ["36", "6", "—", "3", "23.0"],
      ["37", "7", "—", "4", "23.7"],
      ["38", "8", "—", "5", "24.3"],
      ["39", "9", "6", "6", "25.0"],
      ["40", "10", "7", "7", "25.7"],
      ["41", "—", "8", "7.5", "26.3"],
      ["42", "—", "9", "8", "27.0"],
      ["43", "—", "10", "9", "27.7"],
      ["44", "—", "11", "10", "28.3"],
    ],
  },
};

const storeNames = stores.map((store) => store.name);

export const infoPages: Record<string, InfoPage> = {
  contact: {
    eyebrow: "Client services",
    title: "Contact us",
    intro:
      "Our client advisors can help with orders, sizing, product care and gifting, by phone, email or the form below.",
    sections: [
      {
        heading: "Speak to an advisor",
        body: [
          `Phone: ${CLIENT_SERVICES.phone}`,
          `Email: ${CLIENT_SERVICES.email}`,
          CLIENT_SERVICES.hours,
        ],
      },
    ],
    form: {
      fields: [
        { name: "name", label: "Full name", required: true, autoComplete: "name" },
        { name: "email", label: "Email address", type: "email", required: true, autoComplete: "email" },
        {
          name: "topic",
          label: "Topic",
          type: "select",
          required: true,
          options: ["Placing an order", "An existing order", "Sizing and fit", "Product care and repairs", "Something else"],
        },
        { name: "message", label: "Message", type: "textarea", required: true },
      ],
      submitLabel: "Send message",
      successMessage: "Thank you. A client advisor will reply by email within one business day.",
    },
  },
  shipping: {
    eyebrow: "Client services",
    title: "Shipping",
    intro: "Every order ships by express courier at no charge, in signature packaging.",
    sections: [
      {
        heading: "Delivery times",
        body: [
          "Orders placed before 2pm ET on a business day leave our atelier the same day.",
          "Express delivery within the contiguous United States takes 1–2 business days. Alaska and Hawaii take 2–4 business days.",
        ],
      },
      {
        heading: "Tracking",
        body: ["You'll receive a tracking link by email as soon as your order ships. A signature is required on delivery."],
      },
    ],
    links: [
      { label: "Track an order", href: "/orders" },
      { label: "Returns", href: "/returns" },
    ],
  },
  returns: {
    eyebrow: "Client services",
    title: "Returns",
    intro: "Unworn pieces can be returned within 30 days of delivery for a full refund, free of charge.",
    sections: [
      {
        heading: "How to return",
        body: [
          "Contact a client advisor with your order number and we'll email a prepaid return label and arrange a courier collection.",
          "Please return pieces in their original packaging with all tags attached.",
        ],
      },
      {
        heading: "Refunds",
        body: ["Refunds are issued to the original payment method within 5 business days of the return reaching us."],
      },
      {
        heading: "Exceptions",
        body: ["Pierced earrings, personalised pieces and gift cards can't be returned unless faulty."],
      },
    ],
    links: [{ label: "Start a return", href: "/contact" }],
  },
  orders: {
    eyebrow: "Client services",
    title: "Track an order",
    intro: "Enter your order number and the email address you ordered with, and we'll send you its latest status.",
    form: {
      fields: [
        { name: "order", label: "Order number", required: true },
        { name: "email", label: "Email address", type: "email", required: true, autoComplete: "email" },
      ],
      submitLabel: "Track order",
      successMessage: "Thank you. We'll email the latest status of your order within one business day.",
    },
    links: [{ label: "Shipping information", href: "/shipping" }],
  },
  faq: {
    eyebrow: "Client services",
    title: "Frequently asked questions",
    intro: "Answers to the questions our advisors hear most often.",
    faq: [
      {
        question: "How much does shipping cost?",
        answer: "Express shipping and returns are complimentary on every order.",
      },
      {
        question: "How do I find my size?",
        answer: "Our size guide converts between US, UK, EU and Italian sizing. Advisors are also happy to help by phone or email.",
      },
      {
        question: "Can I return a piece?",
        answer: "Yes. Unworn pieces can be returned within 30 days of delivery for a full refund.",
      },
      {
        question: "Do you offer gift wrapping?",
        answer: "Every order arrives in our signature packaging. Add a handwritten note by contacting an advisor.",
      },
      {
        question: "Do you repair leather goods and jewellery?",
        answer: "Yes. We offer lifetime aftercare for leather goods and jewellery. Contact us to arrange a repair.",
      },
    ],
    links: [
      { label: "Size guide", href: "/size-guide" },
      { label: "Contact us", href: "/contact" },
    ],
  },
  about: {
    eyebrow: "The house",
    title: "Our story",
    intro: "Atelier began as a small leather workshop and grew into a house of ready-to-wear, leather goods and jewellery made to be lived in.",
    sections: [
      {
        heading: "Made slowly",
        body: [
          "We work with a small circle of family-run workshops in Italy and Portugal, many of whom we've known for over a decade.",
          "Each collection is designed to sit alongside the last, so pieces can be worn for years rather than seasons.",
        ],
      },
    ],
    links: [
      { label: "Craftsmanship", href: "/craftsmanship" },
      { label: "Sustainability", href: "/sustainability" },
    ],
  },
  craftsmanship: {
    eyebrow: "The house",
    title: "Craftsmanship",
    intro: "Every piece passes through skilled hands, from pattern to final press.",
    sections: [
      {
        heading: "Leather goods",
        body: ["Our bags are cut from full-grain calf leather, edge-painted by hand in up to five layers and stitched with waxed linen thread."],
      },
      {
        heading: "Ready-to-wear",
        body: ["Silks, wools and linens are sourced from European mills and finished with hand-sewn details where they matter most."],
      },
      {
        heading: "Jewellery",
        body: ["Pieces are cast in recycled gold vermeil and sterling silver, then polished by hand in our partner workshop."],
      },
    ],
  },
  sustainability: {
    eyebrow: "The house",
    title: "Sustainability",
    intro: "Making fewer, better things is the most meaningful commitment we can make.",
    sections: [
      {
        heading: "Materials",
        body: ["We prioritise certified leathers, recycled metals and natural fibres, and publish our mills and workshops on request."],
      },
      {
        heading: "Aftercare",
        body: ["Lifetime repairs for leather goods and jewellery keep pieces in use for longer."],
      },
    ],
  },
  careers: {
    eyebrow: "The house",
    title: "Careers",
    intro: "We're a small team of designers, makers and client advisors.",
    sections: [
      {
        heading: "Open roles",
        body: [
          "There are no open roles right now.",
          `To be considered for future positions, send your CV to careers@atelier.example.`,
        ],
      },
    ],
  },
  stores: {
    eyebrow: "Stores",
    title: "Store locator",
    intro: "Visit us in store to see the collection in person, or book a private appointment with an advisor.",
    extra: "stores",
    links: [{ label: "Book an appointment", href: "/appointments" }],
  },
  appointments: {
    eyebrow: "Stores",
    title: "Book an appointment",
    intro: "Try the collection with a personal advisor, in one of our stores or by video call. We'll confirm your appointment by email.",
    form: {
      fields: [
        { name: "name", label: "Full name", required: true, autoComplete: "name" },
        { name: "email", label: "Email address", type: "email", required: true, autoComplete: "email" },
        { name: "phone", label: "Phone number", type: "tel", autoComplete: "tel" },
        { name: "location", label: "Where", type: "select", required: true, options: [...storeNames, "Video call"] },
        { name: "date", label: "Preferred date", type: "date", required: true },
        { name: "notes", label: "What are you looking for?", type: "textarea" },
      ],
      submitLabel: "Request appointment",
      successMessage: "Thank you. An advisor will email you within one business day to confirm a time.",
    },
    links: [{ label: "Store locator", href: "/stores" }],
  },
  "gift-cards": {
    eyebrow: "Stores",
    title: "Gift cards",
    intro: "Atelier gift cards can be redeemed in any of our stores or with a client advisor.",
    sections: [
      {
        heading: "Buying a gift card",
        body: [
          "Gift cards are available in any amount from $100, in our stores or by contacting a client advisor.",
          "They arrive in signature packaging and never expire.",
        ],
      },
    ],
    links: [
      { label: "Contact an advisor", href: "/contact" },
      { label: "Shop the gift edit", href: "/gifts" },
    ],
  },
  "size-guide": {
    eyebrow: "Client services",
    title: "Size guide",
    intro: "Measurements are body measurements. If you're between sizes, we recommend sizing up for a relaxed fit.",
    extra: "size-guide",
    links: [{ label: "Ask an advisor about fit", href: "/contact" }],
  },
  privacy: {
    eyebrow: "Legal",
    title: "Privacy policy",
    intro: "How we collect, use and protect your personal information.",
    sections: [
      {
        heading: "What we collect",
        body: ["The details you give us when you create an account, contact us or subscribe to our letters, such as your name and email address."],
      },
      {
        heading: "How we use it",
        body: ["To provide your account, answer your requests and, if you've subscribed, send our letters. We never sell your information."],
      },
      {
        heading: "Your choices",
        body: [`You can ask us to access, correct or delete your information at any time by writing to ${CLIENT_SERVICES.email}.`],
      },
    ],
  },
  terms: {
    eyebrow: "Legal",
    title: "Terms of use",
    intro: "The terms that apply when you use this site.",
    sections: [
      {
        heading: "Using this site",
        body: ["Content on this site belongs to Atelier and is provided for personal, non-commercial use."],
      },
      {
        heading: "Prices and availability",
        body: ["Prices are shown in US dollars. We make every effort to keep stock information accurate, but availability can change."],
      },
    ],
  },
  accessibility: {
    eyebrow: "Legal",
    title: "Accessibility",
    intro: "We want everyone to be able to browse and shop with us.",
    sections: [
      {
        heading: "Our approach",
        body: ["We aim to meet WCAG 2.2 level AA, and test with keyboards and screen readers as we build."],
      },
      {
        heading: "Need help?",
        body: [`If anything on this site is hard to use, call us on ${CLIENT_SERVICES.phone} and an advisor will help you place your order.`],
      },
    ],
    links: [{ label: "Contact us", href: "/contact" }],
  },
};
