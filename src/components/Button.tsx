import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
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
    'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-ink text-cream hover:bg-ink/90',
    secondary: 'bg-butter text-ink hover:brightness-95',
    outline: 'border border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-cream',
    ghost: 'text-ink hover:bg-ink/5',
  };

  const sizes = {
    sm: 'text-xs px-3 py-2',
    md: 'text-sm px-5 py-2.5',
    lg: 'text-sm px-7 py-3.5 tracking-wide',
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
