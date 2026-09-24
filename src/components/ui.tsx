import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface BreadcrumbsProps {
  items: { label: string; href?: string }[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-light">
      <Link to="/" className="hover:text-ink transition-colors">
        Home
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="text-ink/20">/</span>
          {item.href ? (
            <Link to={item.href} className="hover:text-ink transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-ink">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  link,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: 'left' | 'center';
  link?: { label: string; href: string };
}) {
  return (
    <div className={`flex flex-col gap-3 ${align === 'center' ? 'items-center text-center' : ''}`}>
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-peach">{eyebrow}</span>
      )}
      <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light leading-[1.1] text-ink text-balance">
        {title}
      </h2>
      {description && (
        <p className={`text-sm text-ink-soft leading-relaxed ${align === 'center' ? 'max-w-lg' : 'max-w-xl'}`}>
          {description}
        </p>
      )}
      {link && (
        <Link
          to={link.href}
          className="mt-1 text-sm font-medium text-ink underline-offset-4 hover:underline"
        >
          {link.label} →
        </Link>
      )}
    </div>
  );
}
