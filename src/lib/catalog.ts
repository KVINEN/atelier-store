// Site content for the storefront: navigation, campaigns and curated rails.
// Categories and products live in the database.
// Photography from Unsplash (https://unsplash.com/license), served via next/image.

import { unsplash, type ImageAsset } from "@/lib/images";

/** Shape returned by `getCategories()` in `@/db/queries/catalog`. */
export type Category = {
  slug: string;
  name: string;
  href: string;
  image: ImageAsset;
};

export type EditorialStory = {
  eyebrow: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
  image: ImageAsset;
};

export const navigation = [
  { label: "New In", href: "/new-in" },
  { label: "Women", href: "/women" },
  { label: "Men", href: "/men" },
  { label: "Handbags", href: "/categories/handbags" },
  { label: "Shoes", href: "/categories/shoes" },
  { label: "Jewellery", href: "/categories/jewellery" },
  { label: "Gifts", href: "/gifts" },
] as const;

export const hero = {
  eyebrow: "Autumn–Winter 2026",
  title: "The Quiet Season",
  body: "Soft tailoring, washed linens and leather goods made to be lived in.",
  images: [
    {
      src: unsplash("1617019114583-affb34d1b3cd", 2000),
      alt: "Woman in a white linen shirt dress and dark sunglasses in warm evening light",
    },
    {
      src: unsplash("1581044777550-4cfa60707c03", 2000),
      alt: "Woman in a ruffled pink floral dress standing in a dry grass field",
    },
  ],
  ctas: [
    { label: "Shop Women", href: "/women" },
    { label: "Shop Men", href: "/men" },
  ],
};

// Curated product rails on the home page, in display order.
export const NEW_ARRIVALS = [
  "pink-chain-shoulder-bag",
  "polka-dot-midi-dress",
  "panelled-sneaker",
  "gold-hoop-earrings",
  "silk-bomber-jacket",
  "fringed-knit-poncho",
  "floral-poplin-dress",
  "chambray-shirt",
];

export const GIFT_EDIT = [
  "pearl-necklace",
  "leather-satchel",
  "round-metal-sunglasses",
  "check-wool-overcoat",
  "tapered-trouser",
  "jersey-track-set",
];

export const editorials: EditorialStory[] = [
  {
    eyebrow: "The Outerwear Edit",
    title: "Coats with a point of view",
    body: "Double-faced wool, sculpted shoulders and deep colour. Pieces cut to be worn for decades, not seasons.",
    cta: { label: "Discover outerwear", href: "/women" },
    image: {
      src: unsplash("1483985988355-763728e1935b", 1600),
      alt: "Woman in a burgundy wool coat and red sunglasses carrying shopping bags",
    },
  },
  {
    eyebrow: "Tailoring",
    title: "The new suit, softened",
    body: "Unstructured jackets and fluid trousers in fine Italian wool, made to move through the city.",
    cta: { label: "Shop tailoring", href: "/men" },
    image: {
      src: unsplash("1617137968427-85924c800a22", 1600),
      alt: "Man in a navy suit and white shirt walking past a glass storefront",
    },
  },
];

export const campaign = {
  eyebrow: "Private appointments",
  title: "Visit the atelier",
  body: "Try the collection with a personal advisor, in store or by video call.",
  cta: { label: "Book an appointment", href: "/appointments" },
  image: {
    src: unsplash("1445205170230-053b83016050", 2400),
    alt: "Rail of neutral-toned coats and knitwear inside a softly lit boutique",
  },
};

export const services = [
  {
    title: "Complimentary shipping",
    body: "Free express delivery and returns on every order.",
  },
  {
    title: "Signature packaging",
    body: "Every piece arrives wrapped and ready to give.",
  },
  {
    title: "Client advisors",
    body: "Styling advice by chat, phone or appointment.",
  },
  {
    title: "Repairs & care",
    body: "Lifetime aftercare for leather goods and jewellery.",
  },
];

export const footerColumns = [
  {
    title: "Client services",
    links: [
      { label: "Contact us", href: "/contact" },
      { label: "Shipping", href: "/shipping" },
      { label: "Returns", href: "/returns" },
      { label: "Track an order", href: "/orders" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "The house",
    links: [
      { label: "Our story", href: "/about" },
      { label: "Craftsmanship", href: "/craftsmanship" },
      { label: "Sustainability", href: "/sustainability" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Stores",
    links: [
      { label: "Store locator", href: "/stores" },
      { label: "Book an appointment", href: "/appointments" },
      { label: "Gift cards", href: "/gift-cards" },
    ],
  },
];

