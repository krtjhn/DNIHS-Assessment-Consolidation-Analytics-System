import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function Modal({
    isOpen,
    onClose,
    title,
    icon,
    subtitle,
    children,
    maxWidth = 'max-w-md',
    ariaLabelledBy = 'modal-dialog-title',
}) {
    // Handle Escape key to close
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose?.();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={ariaLabelledBy}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        transition={{
                            type: 'spring',
                            stiffness: 380,
                            damping: 28,
                            mass: 0.8,
                        }}
                        className={`relative w-full ${maxWidth} rounded-2xl bg-white p-6 shadow-2xl border border-slate-200/80 z-10`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {title && (
                            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                                <div className="flex items-center gap-2.5">
                                    {icon && (
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#0071e3]/10 text-[#0071e3]">
                                            {icon}
                                        </div>
                                    )}
                                    <div>
                                        <h3 id={ariaLabelledBy} className="text-base font-bold text-slate-900">
                                            {title}
                                        </h3>
                                        {subtitle && (
                                            <p className="text-[11px] text-slate-500">{subtitle}</p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Close dialog"
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
