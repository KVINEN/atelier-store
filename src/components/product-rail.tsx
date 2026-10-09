"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { ArrowRightIcon } from "@/components/icons";

// Horizontal product carousel: swipe on touch, arrow buttons from md up.
export function ProductRail({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const update = () =>
      setEdges({
        start: rail.scrollLeft <= 1,
        end: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 1,
      });

    update();
    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      rail.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollByPage = (direction: 1 | -1) => {
    const rail = railRef.current;
    rail?.scrollBy({ left: direction * rail.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={railRef}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="rail bleed md:mx-0"
      >
        {children}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-[calc((100%-5rem)/2)] hidden -translate-y-1/2 justify-between md:flex">
        <button
          type="button"
          className="btn-icon bg-paper hairline pointer-events-auto -ml-5.5 disabled:invisible"
          aria-label="Previous products"
          disabled={edges.start}
          onClick={() => scrollByPage(-1)}
        >
          <ArrowRightIcon className="rotate-180" />
        </button>
        <button
          type="button"
          className="btn-icon bg-paper hairline pointer-events-auto -mr-5.5 disabled:invisible"
          aria-label="Next products"
          disabled={edges.end}
          onClick={() => scrollByPage(1)}
        >
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
}
