"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import type { ImageAsset } from "@/lib/images";

// Swipeable full-width carousel on small screens; a two-column grid of large
// images from lg up, scrolling alongside the sticky product information.
export function ProductGallery({ images }: { images: ImageAsset[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] lg:grid lg:grid-cols-2 lg:gap-(--grid-gap) lg:overflow-visible"
      >
        {images.map((image, i) => (
          <div key={image.src} className="media-product w-full shrink-0 snap-start lg:w-auto">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(min-width: 80rem) 30vw, (min-width: 64rem) 28vw, 100vw"
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
            />
          </div>
        ))}
      </div>

      <p
        aria-hidden="true"
        className="text-eyebrow bg-paper absolute right-3 bottom-3 px-2 py-1 tabular-nums lg:hidden"
      >
        {index + 1} / {images.length}
      </p>
    </div>
  );
}
