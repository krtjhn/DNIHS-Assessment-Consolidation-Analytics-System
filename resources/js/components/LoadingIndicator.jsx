import React from 'react';

// Size presets for standard loading indicators
const SIZES = {
    xs: 'size-3.5',
    sm: 'size-4',
    md: 'size-6',
    lg: 'size-8',
    xl: 'size-10',
};

// 8-Dot Circle SVG Spinner with decaying opacity matching Apple HIG design
function DotCircleSvg({ className = '' }) {
    return (
        <svg
            className={`animate-spin ${className}`}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <circle cx="12" cy="4.5" r="1.75" fill="currentColor" opacity="1" />
            <circle cx="17.3" cy="6.7" r="1.75" fill="currentColor" opacity="0.88" />
            <circle cx="19.5" cy="12" r="1.75" fill="currentColor" opacity="0.75" />
            <circle cx="17.3" cy="17.3" r="1.75" fill="currentColor" opacity="0.62" />
            <circle cx="12" cy="19.5" r="1.75" fill="currentColor" opacity="0.5" />
            <circle cx="6.7" cy="17.3" r="1.75" fill="currentColor" opacity="0.38" />
            <circle cx="4.5" cy="12" r="1.75" fill="currentColor" opacity="0.25" />
            <circle cx="6.7" cy="6.7" r="1.75" fill="currentColor" opacity="0.12" />
        </svg>
    );
}

// Reusable LoadingIndicator component supporting various sizes and labels
export function LoadingIndicator({
    type = 'dot-circle',
    size = 'md',
    className = '',
    label,
    orientation = 'vertical',
    children,
    ...rest
}) {
    const sizeClass = SIZES[size] || SIZES.md;
    const resolvedLabel = label || children;

    // Render standalone icon when no text label is provided
    if (!resolvedLabel) {
        return (
            <span
                role="status"
                aria-label="Loading"
                className={`inline-flex shrink-0 items-center justify-center ${className || 'text-[#0071e3]'}`}
                {...rest}
            >
                <DotCircleSvg className={sizeClass} />
                <span className="sr-only">Loading</span>
            </span>
        );
    }

    // Render centered layout with label text
    const isHorizontal = orientation === 'horizontal';

    return (
        <div
            role="status"
            className={`inline-flex items-center justify-center gap-2.5 ${
                isHorizontal ? 'flex-row' : 'flex-col text-center'
            } ${className}`}
            {...rest}
        >
            <span className="shrink-0 text-[#0071e3]">
                <DotCircleSvg className={sizeClass} />
            </span>
            <span className="text-xs font-semibold tracking-wide text-slate-500">
                {resolvedLabel}
            </span>
        </div>
    );
}

export default LoadingIndicator;
