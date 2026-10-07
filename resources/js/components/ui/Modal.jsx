import React, { useEffect } from 'react';
import { X } from 'lucide-react';

// + Apple HIG Modal Dialog Component
export function Modal({ isOpen, onClose, title, description, children, maxWidth = 'max-w-lg' }) {
    // + Pindutin ang Escape key para sumara
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* + Translucent Frosted Glass Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity duration-200"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* + Modal Surface Card */}
            <div
                className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden transform transition-all duration-200 z-10`}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 tracking-tight">{title}</h3>
                        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3]"
                    >
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>

                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}
