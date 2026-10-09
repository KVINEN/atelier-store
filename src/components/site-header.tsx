"use client";

import Link from "next/link";
import { useRef } from "react";

import {
  BagIcon,
  CloseIcon,
  HeartIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "@/components/icons";
import { navigation } from "@/lib/catalog";
import { useBag } from "@/lib/shop-store";

const primaryLinks = navigation.filter((item) =>
  ["Women", "Men", "Gifts"].includes(item.label),
);

export function SiteHeader() {
  const menuRef = useRef<HTMLDialogElement>(null);
  const { count: bagCount } = useBag();

  const openMenu = () => menuRef.current?.showModal();
  const closeMenu = () => menuRef.current?.close();

  return (
    <>
      <p className="bg-ink text-paper text-eyebrow py-2.5 text-center">
        Complimentary express shipping and returns
      </p>

      <header className="header-bar">
        <div className="container-page grid h-full grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex items-center gap-6">
            <button
              type="button"
              className="btn-icon -ml-3"
              aria-label="Open menu"
              aria-haspopup="dialog"
              onClick={openMenu}
            >
              <MenuIcon />
            </button>
            <nav aria-label="Primary" className="hidden lg:block">
              <ul className="cluster gap-7">
                {primaryLinks.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-label link-quiet">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <Link
            href="/"
            className="text-lg font-medium tracking-[0.32em] uppercase md:text-xl"
          >
            Atelier
          </Link>

          <div className="-mr-3 flex items-center justify-end">
            <Link href="/search" className="btn-icon" aria-label="Search">
              <SearchIcon />
            </Link>
            <Link
              href="/account"
              className="btn-icon hidden sm:inline-flex"
              aria-label="Account"
            >
              <UserIcon />
            </Link>
            <Link
              href="/wishlist"
              className="btn-icon hidden sm:inline-flex"
              aria-label="Saved items"
            >
              <HeartIcon />
            </Link>
            <Link
              href="/bag"
              className="btn-icon relative"
              aria-label={`Bag, ${bagCount} ${bagCount === 1 ? "item" : "items"}`}
            >
              <BagIcon />
              {bagCount > 0 ? (
                <span
                  aria-hidden="true"
                  className="bg-ink text-paper absolute top-1.5 right-1 flex size-4 items-center justify-center rounded-full text-[0.625rem] leading-none tabular-nums"
                >
                  {bagCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>

      <dialog
        ref={menuRef}
        aria-label="Menu"
        className="bg-paper text-ink backdrop:bg-overlay m-0 h-dvh max-h-none w-full max-w-md open:flex open:flex-col"
        onClick={(event) => {
          // Clicking the backdrop (outside the panel) closes the menu.
          if (event.target === event.currentTarget) closeMenu();
        }}
      >
        <div className="flex h-(--header-height) shrink-0 items-center justify-between px-(--gutter) hairline-b">
          <span className="text-label">Menu</span>
          <button
            type="button"
            className="btn-icon -mr-3"
            aria-label="Close menu"
            onClick={closeMenu}
          >
            <CloseIcon />
          </button>
        </div>

        <nav aria-label="Menu" className="flex-1 overflow-y-auto px-(--gutter) py-8">
          <ul className="stack gap-5">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="link-quiet text-xl"
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="stack gap-3 px-(--gutter) py-6 hairline-t">
          <Link href="/account" className="text-label link-quiet" onClick={closeMenu}>
            My account
          </Link>
          <Link href="/wishlist" className="text-label link-quiet" onClick={closeMenu}>
            Saved items
          </Link>
          <Link href="/bag" className="text-label link-quiet" onClick={closeMenu}>
            Bag{bagCount > 0 ? ` (${bagCount})` : ""}
          </Link>
          <Link href="/search" className="text-label link-quiet" onClick={closeMenu}>
            Search
          </Link>
          <Link href="/appointments" className="text-label link-quiet" onClick={closeMenu}>
            Book an appointment
          </Link>
          <Link href="/contact" className="text-label link-quiet" onClick={closeMenu}>
            Contact us
          </Link>
        </div>
      </dialog>
    </>
  );
}
