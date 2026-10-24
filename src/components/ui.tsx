import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface BreadcrumbsProps {
  items: { label: string; href?: string }[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-charcoal-light">
      <Link to="/" className="hover:text-charcoal transition-colors">
        Home
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="text-border">/</span>
          {item.href ? (
            <Link to={item.href} className="hover:text-charcoal transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-charcoal">{item.label}</span>
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
    <div className={`flex flex-col gap-2.5 ${align === 'center' ? 'items-center text-center' : ''}`}>
      {eyebrow && (
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-clay">
          {eyebrow}
        </span>
      )}
      <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-light leading-[1.15] text-charcoal text-balance">
        {title}
      </h2>
      {description && (
        <p className={`text-sm text-charcoal-light leading-relaxed ${align === 'center' ? 'max-w-md' : 'max-w-lg'}`}>
          {description}
        </p>
      )}
      {link && (
        <Link
          to={link.href}
          className="mt-1 text-[13px] font-medium text-charcoal underline-offset-4 hover:underline hover:text-clay transition-colors"
        >
          {link.label} →
        </Link>
      )}
    </div>
  );
}
