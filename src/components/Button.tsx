import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/30 disabled:opacity-40 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-charcoal text-ivory hover:bg-charcoal/88',
    outline: 'border border-border text-charcoal hover:border-charcoal hover:bg-charcoal hover:text-ivory',
    ghost: 'text-charcoal hover:bg-charcoal/5',
  };

  const sizes = {
    sm: 'text-xs px-4 py-2',
    md: 'text-[13px] px-5 py-2.5',
    lg: 'text-[13px] px-7 py-3.5 tracking-wide',
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
