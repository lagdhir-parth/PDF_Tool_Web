import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none focus:ring-2 focus:ring-offset-2';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5 font-semibold',
  };

  const variantClasses = {
    primary:
      'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 active:scale-[0.98] focus:ring-indigo-500',
    secondary:
      'bg-slate-800 hover:bg-slate-900 text-white shadow-sm active:scale-[0.98] focus:ring-slate-700',
    outline:
      'border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 shadow-xs focus:ring-indigo-500',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 active:scale-[0.98] focus:ring-rose-500',
    ghost:
      'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-400',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        leftIcon && <span>{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span>{rightIcon}</span>}
    </button>
  );
};
