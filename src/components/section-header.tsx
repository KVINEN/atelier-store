import Link from "next/link";

export function SectionHeader({
  id,
  eyebrow,
  title,
  link,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  link?: { label: string; href: string };
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6 md:mb-10">
      <div className="stack gap-3">
        {eyebrow ? <p className="text-eyebrow text-mute">{eyebrow}</p> : null}
        <h2 id={id} className="text-heading">
          {title}
        </h2>
      </div>
      {link ? (
        <Link href={link.href} className="text-label link shrink-0">
          {link.label}
        </Link>
      ) : null}
    </div>
  );
}
