import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Magnetic from './Magnetic';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'forest' | 'brass' | 'terracotta' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  magnetic?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  magnetic = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'relative inline-flex items-center justify-center gap-2 font-medium tracking-wider uppercase transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass/40 disabled:opacity-40 disabled:cursor-not-allowed select-none overflow-hidden';

  const variants = {
    primary:
      'bg-espresso text-ivory border border-espresso hover:bg-forest hover:border-forest shadow-xs',
    forest:
      'bg-forest text-ivory border border-forest hover:bg-forest-dark shadow-xs',
    brass:
      'bg-brass text-espresso font-semibold border border-brass hover:bg-brass-dark hover:text-white shadow-xs',
    terracotta:
      'bg-terracotta text-white border border-terracotta hover:bg-terracotta-dark shadow-xs',
    outline:
      'border border-espresso/20 bg-transparent text-espresso hover:border-espresso hover:bg-espresso hover:text-ivory',
    ghost:
      'text-espresso hover:bg-espresso/5 border border-transparent',
  };

  const sizes = {
    sm: 'text-[11px] px-4 py-2 rounded-full',
    md: 'text-xs px-5 py-2.5 rounded-full',
    lg: 'text-xs px-7 py-3.5 rounded-full tracking-[0.14em]',
  };

  const buttonElement = (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );

  if (magnetic && !props.disabled) {
    return <Magnetic strength={0.18}>{buttonElement}</Magnetic>;
  }

  return buttonElement;
}
