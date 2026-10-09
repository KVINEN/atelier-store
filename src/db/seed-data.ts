// Placeholder catalogue loaded into the database by `npm run db:seed`.
// Photography from Unsplash (https://unsplash.com/license); gallery detail
// shots are focal-point crops of the same photograph.

import type { Category } from "@/lib/catalog";
import { unsplash, type ImageAsset } from "@/lib/images";
import { ONE_SIZE, type Product, type Variant } from "@/lib/products";

/** Products reference their category by name. */
export type SeedProduct = Omit<Product, "category"> & { category: string };

/** In display order. */
export const seedCategories: Category[] = [
  {
    slug: "ready-to-wear",
    name: "Ready-to-Wear",
    href: "/categories/ready-to-wear",
    image: {
      src: unsplash("1496747611176-843222e1e57c", 900),
      alt: "Floral wrap dress moving in the wind by the sea",
    },
  },
  {
    slug: "handbags",
    name: "Handbags",
    href: "/categories/handbags",
    image: {
      src: unsplash("1605733513597-a8f8341084e6", 900),
      alt: "Grey leather satchel with two buckled straps",
    },
  },
  {
    slug: "shoes",
    name: "Shoes",
    href: "/categories/shoes",
    image: {
      src: unsplash("1543163521-1bf539c55dd2", 900),
      alt: "Pair of floral print stiletto pumps against a pale blue wall",
    },
  },
  {
    slug: "menswear",
    name: "Menswear",
    href: "/categories/menswear",
    image: {
      src: unsplash("1507679799987-c73779587ccf", 900),
      alt: "Man buttoning a navy suit jacket over a striped tie",
    },
  },
  {
    slug: "jewellery",
    name: "Jewellery",
    href: "/categories/jewellery",
    image: {
      src: unsplash("1535632066927-ab7c9ab60908", 900),
      alt: "Crystal and sapphire drop earrings on a green leaf",
    },
  },
  {
    slug: "eyewear",
    name: "Eyewear",
    href: "/categories/eyewear",
    image: {
      src: unsplash("1511499767150-a48a237f0083", 900),
      alt: "Round gold-frame sunglasses with green lenses on white",
    },
  },
];

type Detail = { x: number; y: number; zoom: number; alt: string };

function gallery(id: string, alt: string, details: Detail[]): ImageAsset[] {
  return [
    { src: unsplash(id), alt },
    ...details.map(({ alt: detailAlt, ...focus }) => ({
      src: unsplash(id, 1200, focus),
      alt: detailAlt,
    })),
  ];
}

const apparel = (stock: [number, number, number, number, number]): Variant[] =>
  ["XS", "S", "M", "L", "XL"].map((size, i) => ({ size, stock: stock[i] }));

const oneSize = (stock: number): Variant[] => [{ size: ONE_SIZE, stock }];

export const seedProducts: SeedProduct[] = [
  {
    slug: "pink-chain-shoulder-bag",
    sku: "AT-HB-1042",
    name: "Chevron chain shoulder bag",
    category: "Handbags",
    gender: "women",
    price: 2150,
    color: "Blush",
    colors: 3,
    badge: "New",
    description:
      "A compact flap bag in smooth calf leather, inlaid with a hand-painted chevron. The sliding chain strap wears on the shoulder or doubled by hand.",
    details: [
      "Smooth calf leather with painted edges",
      "Sliding palladium-finish chain, 55 cm drop",
      "Magnetic flap closure, one interior slip pocket",
      "W 24 × H 15 × D 7 cm",
      "Made in Italy",
    ],
    variants: oneSize(2),
    images: gallery(
      "1566150905458-1bf1fc113f0d",
      "Pink leather shoulder bag with a cream chevron and chain strap",
      [
        { x: 0.35, y: 0.35, zoom: 2.4, alt: "Close-up of the painted chevron inlay" },
        { x: 0.88, y: 0.55, zoom: 2.6, alt: "Detail of the palladium chain strap" },
        { x: 0.4, y: 0.62, zoom: 1.6, alt: "The bag resting on a white plinth" },
      ],
    ),
  },
  {
    slug: "polka-dot-midi-dress",
    sku: "AT-RW-2210",
    name: "Polka dot silk midi dress",
    category: "Ready-to-Wear",
    gender: "women",
    price: 1680,
    color: "Cherry / ivory",
    colors: 2,
    badge: "New",
    description:
      "Bias-cut silk crêpe de chine in an archival dot print, with a ruffled neckline and an asymmetric hem that moves as you walk.",
    details: [
      "100% silk crêpe de chine",
      "Bias cut, relaxed through the body",
      "Ruffled off-shoulder neckline",
      "Concealed side zip",
      "Dry clean only · Made in Italy",
    ],
    variants: apparel([0, 2, 5, 4, 1]),
    images: gallery(
      "1502716119720-b23a93e5fe1b",
      "Model in a red polka dot silk midi dress in a dry field",
      [
        { x: 0.45, y: 0.3, zoom: 2.2, alt: "Detail of the ruffled neckline and dot print" },
        { x: 0.55, y: 0.65, zoom: 2, alt: "The asymmetric hem in motion" },
        { x: 0.5, y: 0.5, zoom: 1.4, alt: "Model holding the skirt of the dress" },
      ],
    ),
  },
  {
    slug: "panelled-sneaker",
    sku: "AT-SH-3307",
    name: "Panelled suede sneaker",
    category: "Shoes",
    gender: "unisex",
    price: 890,
    color: "Mint multi",
    colors: 4,
    description:
      "A chunky runner built from suede, mesh and leather panels in a sorbet palette, set on a sculpted rubber sole.",
    details: [
      "Suede, technical mesh and calf leather",
      "Contrast laces, padded collar",
      "Sculpted rubber sole, 4 cm",
      "Sizes are EU; we recommend your usual size",
      "Made in Italy",
    ],
    variants: ["36", "37", "38", "39", "40", "41", "42"].map((size, i) => ({
      size,
      stock: [3, 0, 6, 8, 2, 0, 5][i],
    })),
    images: gallery(
      "1560769629-975ec94e6a86",
      "Pair of multicolour panelled sneakers on white blocks",
      [
        { x: 0.25, y: 0.25, zoom: 2.2, alt: "Side panels and laces of the upper" },
        { x: 0.6, y: 0.7, zoom: 2.2, alt: "Sneaker with the sculpted sole" },
        { x: 0.45, y: 0.5, zoom: 1.3, alt: "Both sneakers staged on white blocks" },
      ],
    ),
  },
  {
    slug: "gold-hoop-earrings",
    sku: "AT-JW-4120",
    name: "Sculpted gold hoop earrings",
    category: "Jewellery",
    gender: "women",
    price: 640,
    color: "Yellow gold",
    colors: 1,
    badge: "Exclusive",
    description:
      "Twisted chain-link hoops cast in 18k gold-plated sterling silver. Weighty enough to feel precious, light enough for every day.",
    details: [
      "18k gold vermeil on sterling silver",
      "Hinged snap closure",
      "Diameter 2.4 cm",
      "Presented in a signature box",
    ],
    variants: oneSize(12),
    images: gallery(
      "1617038220319-276d3cfab638",
      "Pair of chunky gold hoop earrings in soft shadow",
      [
        { x: 0.55, y: 0.72, zoom: 2.4, alt: "Close-up of a twisted gold hoop" },
        { x: 0.45, y: 0.55, zoom: 1.8, alt: "Hoop earring resting on a pebble" },
        { x: 0.5, y: 0.6, zoom: 1.3, alt: "Earrings in raking light" },
      ],
    ),
  },
  {
    slug: "silk-bomber-jacket",
    sku: "AT-RW-2264",
    name: "Silk twill bomber jacket",
    category: "Ready-to-Wear",
    gender: "unisex",
    price: 2700,
    color: "Terracotta",
    colors: 2,
    description:
      "A lightweight bomber in washed silk twill with a soft sheen, finished with rib trims and a utility sleeve pocket.",
    details: [
      "100% silk twill, cupro lining",
      "Two-way zip, rib collar, cuffs and hem",
      "Zipped utility pocket on the sleeve",
      "Dry clean only · Made in Italy",
    ],
    variants: apparel([0, 0, 0, 0, 0]),
    images: gallery(
      "1591047139829-d91aecb6caea",
      "Rust silk bomber jacket held up on a hanger",
      [
        { x: 0.45, y: 0.55, zoom: 2.2, alt: "Zip and front panel of the bomber" },
        { x: 0.45, y: 0.85, zoom: 2.4, alt: "Ribbed hem and welt pocket" },
        { x: 0.85, y: 0.5, zoom: 2.4, alt: "Utility pocket on the sleeve" },
      ],
    ),
  },
  {
    slug: "fringed-knit-poncho",
    sku: "AT-RW-2291",
    name: "Fringed cotton knit poncho",
    category: "Ready-to-Wear",
    gender: "women",
    price: 1350,
    color: "Ecru",
    colors: 2,
    badge: "Limited",
    description:
      "Hand-crocheted in an open mesh of organic cotton, with a deep V neckline and a long knotted fringe. A limited run of 200 pieces.",
    details: [
      "100% organic cotton",
      "Hand-crocheted open mesh",
      "Hand-knotted fringe",
      "Hand wash cold, dry flat",
    ],
    variants: oneSize(1),
    images: gallery(
      "1434389677669-e08b4cac3105",
      "Cream open-knit poncho with fringe hanging on a wall hook",
      [
        { x: 0.45, y: 0.45, zoom: 2.4, alt: "Close-up of the open crochet mesh" },
        { x: 0.4, y: 0.85, zoom: 2.4, alt: "Detail of the knotted fringe" },
        { x: 0.45, y: 0.25, zoom: 2, alt: "V neckline on the hanger" },
      ],
    ),
  },
  {
    slug: "floral-poplin-dress",
    sku: "AT-RW-2236",
    name: "Belted floral poplin dress",
    category: "Ready-to-Wear",
    gender: "women",
    price: 1950,
    color: "Scarlet floral",
    colors: 1,
    description:
      "A full-skirted dress in crisp cotton poplin with a wrap bodice and a leather belt in natural tan.",
    details: [
      "100% cotton poplin, cotton voile lining",
      "Wrap bodice with cap sleeves",
      "Removable tan leather belt",
      "Machine wash cold · Made in Portugal",
    ],
    variants: apparel([4, 6, 3, 2, 0]),
    images: gallery(
      "1572804013309-59a88b7e92f1",
      "Model in a red floral poplin dress with a tan belt against an ochre wall",
      [
        { x: 0.5, y: 0.5, zoom: 2.6, alt: "Detail of the tan leather belt" },
        { x: 0.5, y: 0.75, zoom: 2, alt: "The full floral skirt" },
        { x: 0.5, y: 0.38, zoom: 2, alt: "Wrap bodice and cap sleeves" },
      ],
    ),
  },
  {
    slug: "chambray-shirt",
    sku: "AT-MN-5108",
    name: "Embroidered chambray shirt",
    category: "Menswear",
    gender: "men",
    price: 720,
    color: "Washed indigo",
    colors: 3,
    description:
      "A soft-washed chambray shirt scattered with tiny hand-embroidered hearts. Cut slim with a short point collar.",
    details: [
      "100% cotton chambray",
      "Tonal embroidery, mother-of-pearl buttons",
      "Slim fit, three-quarter roll-up sleeves",
      "Machine wash cold · Made in Portugal",
    ],
    variants: ["S", "M", "L", "XL", "XXL"].map((size, i) => ({
      size,
      stock: [5, 9, 7, 3, 2][i],
    })),
    images: gallery(
      "1596755094514-f87e34085b2c",
      "Blue chambray shirt with a small embroidered motif on a hanger",
      [
        { x: 0.45, y: 0.6, zoom: 2.6, alt: "Close-up of the embroidered heart motif" },
        { x: 0.5, y: 0.7, zoom: 2.2, alt: "Placket and mother-of-pearl buttons" },
        { x: 0.25, y: 0.65, zoom: 2.2, alt: "Rolled sleeve detail" },
      ],
    ),
  },
  {
    slug: "pearl-necklace",
    sku: "AT-JW-4155",
    name: "Freshwater pearl necklace",
    category: "Jewellery",
    gender: "women",
    price: 980,
    color: "Ivory",
    colors: 1,
    description:
      "Hand-knotted freshwater pearls on silk, closed with a pavé crystal rose clasp that can be worn at the front.",
    details: [
      "7–8 mm freshwater pearls",
      "Hand-knotted on silk thread",
      "Rhodium-plated clasp with crystal pavé",
      "Length 42 cm",
    ],
    variants: oneSize(8),
    images: gallery(
      "1515562141207-7a88fb7ce338",
      "Strand of freshwater pearls in an open jewellery box",
      [
        { x: 0.45, y: 0.6, zoom: 2.4, alt: "Close-up of the pavé rose clasp" },
        { x: 0.5, y: 0.45, zoom: 2.4, alt: "Hand-knotted pearls" },
        { x: 0.5, y: 0.55, zoom: 1.4, alt: "Necklace laid in its presentation box" },
      ],
    ),
  },
  {
    slug: "leather-satchel",
    sku: "AT-HB-1077",
    name: "Buckled leather satchel",
    category: "Handbags",
    gender: "unisex",
    price: 1850,
    color: "Dove grey",
    colors: 3,
    description:
      "A school satchel reworked in pebbled leather, with twin buckles, a top handle and a detachable shoulder strap.",
    details: [
      "Pebbled calf leather, cotton lining",
      "Gold-finish buckles and hardware",
      "Top handle and detachable strap",
      "W 26 × H 20 × D 9 cm · Made in Italy",
    ],
    variants: oneSize(0),
    images: gallery(
      "1605733513597-a8f8341084e6",
      "Grey leather satchel with two buckled straps",
      [
        { x: 0.35, y: 0.6, zoom: 2.6, alt: "Close-up of a gold-finish buckle" },
        { x: 0.5, y: 0.3, zoom: 2.2, alt: "Top handle and stitching" },
        { x: 0.5, y: 0.7, zoom: 1.8, alt: "Pebbled leather front panel" },
      ],
    ),
  },
  {
    slug: "tapered-trouser",
    sku: "AT-RW-2302",
    name: "Tapered crepe trouser",
    category: "Ready-to-Wear",
    gender: "women",
    price: 860,
    color: "Blush",
    colors: 3,
    description:
      "Fluid crepe trousers with an elasticated waist, patch pockets and gathered cuffs that sit just above the ankle.",
    details: [
      "Viscose crepe",
      "Elasticated waist, front patch pockets",
      "Gathered ankle cuffs",
      "Machine wash cold",
    ],
    variants: apparel([2, 7, 8, 3, 1]),
    images: gallery(
      "1594633312681-425c7b97ccd1",
      "Blush crepe trousers with gathered ankles and nude heels",
      [
        { x: 0.5, y: 0.15, zoom: 2.4, alt: "Waistband and patch pockets" },
        { x: 0.5, y: 0.8, zoom: 2.4, alt: "Gathered ankle cuffs" },
        { x: 0.5, y: 0.45, zoom: 1.6, alt: "Drape of the crepe through the leg" },
      ],
    ),
  },
  {
    slug: "check-wool-overcoat",
    sku: "AT-RW-2188",
    name: "Check wool overcoat",
    category: "Ready-to-Wear",
    gender: "women",
    price: 3400,
    color: "Forest check",
    colors: 2,
    description:
      "A relaxed single-breasted overcoat in double-faced wool, woven in a deep forest and navy windowpane check.",
    details: [
      "Double-faced virgin wool",
      "Unlined, hand-finished seams",
      "Single-breasted, patch pockets",
      "Dry clean only · Made in Italy",
    ],
    variants: apparel([1, 3, 4, 2, 2]),
    images: gallery(
      "1485968579580-b6d095142e6e",
      "Woman in a forest green check wool overcoat on a city street",
      [
        { x: 0.4, y: 0.6, zoom: 2.6, alt: "Close-up of the windowpane check" },
        { x: 0.4, y: 0.45, zoom: 2, alt: "Relaxed shoulder and lapel" },
        { x: 0.4, y: 0.55, zoom: 1.4, alt: "Overcoat worn on the street" },
      ],
    ),
  },
  {
    slug: "jersey-track-set",
    sku: "AT-RW-2319",
    name: "Brushed jersey track set",
    category: "Ready-to-Wear",
    gender: "unisex",
    price: 1100,
    color: "Saffron",
    colors: 4,
    description:
      "A cropped hoodie and relaxed jogger in brushed organic cotton jersey, garment-dyed for a lived-in colour.",
    details: [
      "Brushed organic cotton jersey",
      "Cropped hoodie and drawstring jogger",
      "Garment dyed",
      "Machine wash cold · Made in Portugal",
    ],
    variants: apparel([3, 5, 6, 4, 3]),
    images: gallery(
      "1515886657613-9f3515b0c78f",
      "Model in a saffron cropped hoodie and joggers by a basketball court",
      [
        { x: 0.6, y: 0.25, zoom: 2.4, alt: "Cropped hoodie with drawstrings" },
        { x: 0.6, y: 0.65, zoom: 2.2, alt: "Relaxed jogger with cuffed ankle" },
        { x: 0.6, y: 0.5, zoom: 1.4, alt: "Full look against a blue sky" },
      ],
    ),
  },
  {
    slug: "round-metal-sunglasses",
    sku: "AT-EY-6012",
    name: "Round metal sunglasses",
    category: "Eyewear",
    gender: "unisex",
    price: 520,
    color: "Gold / bottle green",
    colors: 3,
    description:
      "Fine round frames in gold-finish titanium with bottle-green mineral glass lenses and adjustable nose pads.",
    details: [
      "Gold-finish titanium frame",
      "Mineral glass lenses, 100% UV protection",
      "Adjustable nose pads",
      "Includes leather case and cloth",
    ],
    variants: oneSize(20),
    images: gallery(
      "1511499767150-a48a237f0083",
      "Round gold-frame sunglasses with green lenses on white",
      [
        { x: 0.35, y: 0.5, zoom: 2.4, alt: "Bottle-green lens and fine gold rim" },
        { x: 0.75, y: 0.45, zoom: 2.4, alt: "Temple and hinge detail" },
        { x: 0.5, y: 0.55, zoom: 1.5, alt: "Sunglasses and their reflection" },
      ],
    ),
  },
];
