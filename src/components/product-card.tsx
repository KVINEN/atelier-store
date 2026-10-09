import Image from "next/image";
import Link from "next/link";

import { SaveButton } from "@/components/save-button";
import { StockStatus } from "@/components/stock-status";
import {
  formatPrice,
  stockState,
  totalStock,
  type Product,
} from "@/lib/products";

type ProductCardProps = {
  product: Product;
  sizes?: string;
};

export function ProductCard({
  product,
  sizes = "(min-width: 80rem) 25vw, (min-width: 48rem) 33vw, 50vw",
}: ProductCardProps) {
  const href = `/products/${product.slug}`;
  const [image] = product.images;
  const stock = totalStock(product);

  return (
    <article className="group relative">
      <div className="media-product">
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0"
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes={sizes}
            className="transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </Link>
        {product.badge ? (
          <span className="text-eyebrow bg-paper pointer-events-none absolute top-3 left-3 px-2 py-1">
            {product.badge}
          </span>
        ) : null}
        <div className="absolute top-1 right-1">
          <SaveButton productName={product.name} />
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1 px-3 md:px-0">
        <h3 className="text-product">
          <Link href={href} className="link-quiet">
            {product.name}
          </Link>
        </h3>
        <p className="text-price">{formatPrice(product.price)}</p>
        {stockState(stock) === "in-stock" ? (
          product.colors > 1 ? (
            <p className="text-meta">{product.colors} colours</p>
          ) : null
        ) : (
          <StockStatus quantity={stock} />
        )}
      </div>
    </article>
  );
}
