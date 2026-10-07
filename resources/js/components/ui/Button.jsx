import React from 'react';

// + Apple HIG Semantic Button Component
export function Button({
    children,
    type = 'button',
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    onClick,
    className = '',
    ...props
}) {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer';

    const variants = {
        primary: 'bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-sm shadow-blue-500/20',
        secondary: 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-xs',
        destructive: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20',
        ghost: 'bg-transparent hover:bg-slate-200/60 text-slate-700',
    };

    const sizes = {
        sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
        md: 'text-sm px-4 py-2 gap-2 h-10',
        lg: 'text-base px-5 py-2.5 gap-2.5 h-12',
    };

    return (
        <button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
            {...props}
        >
            {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
            )}
            {children}
        </button>
    );
}
