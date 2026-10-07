import React from 'react';

// + Apple HIG Pill Badge Component para sa Roles at DepEd Mastery Levels
export function Badge({ children, variant = 'default', size = 'sm', className = '' }) {
    const baseStyles = 'inline-flex items-center font-medium rounded-full';

    const variants = {
        default: 'bg-slate-100 text-slate-700 border border-slate-200/80',
        admin: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80',
        teacher: 'bg-sky-50 text-sky-700 border border-sky-200/80',
        // + DepEd Official 7-Level Mastery Variants
        mastered: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
        closely: 'bg-teal-50 text-teal-700 border border-teal-200/80',
        moving: 'bg-blue-50 text-blue-700 border border-blue-200/80',
        average: 'bg-amber-50 text-amber-800 border border-amber-200/80',
        low: 'bg-orange-50 text-orange-700 border border-orange-200/80',
        veryLow: 'bg-rose-50 text-rose-700 border border-rose-200/80',
        noMastery: 'bg-red-100 text-red-800 border border-red-300',
    };

    const sizes = {
        sm: 'text-xs px-2.5 py-0.5',
        md: 'text-sm px-3 py-1',
    };

    return (
        <span className={`${baseStyles} ${variants[variant] || variants.default} ${sizes[size] || sizes.sm} ${className}`}>
            {children}
        </span>
    );
}
