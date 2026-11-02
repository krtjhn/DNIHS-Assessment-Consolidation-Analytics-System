import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SidebarToggleIcon } from './Sidebar.jsx';

export default function TopBar({
    user,
    activeTab,
    onOpenMobileSidebar,
}) {
    const pageDetails = {
        overview: { title: 'Executive Overview (DSS)' },
        records: { title: 'Record Entry' },
        consolidation: { title: 'Consolidated Reports' },
        sections: { title: 'Section Management' },
        assignments: { title: 'Class Assignments' },
        calendar: { title: 'School Calendar' },
        teachers: { title: 'Teacher Accounts' },
    };

    const currentPage = pageDetails[activeTab] || pageDetails.records;

    return (
        <motion.header
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28, delay: 0.04 }}
            className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-100 bg-white/95 px-4 backdrop-blur-xs md:px-6"
        >
            {
                // Left section: mobile drawer trigger and animated page title
            }
            <div className="flex min-w-0 items-center gap-3">
                <motion.button
                    type="button"
                    onClick={onOpenMobileSidebar}
                    whileTap={{ scale: 0.92 }}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/40 md:hidden cursor-pointer"
                    aria-label="Open navigation menu"
                    title="Open navigation menu"
                >
                    <SidebarToggleIcon className="size-5" />
                </motion.button>

                <div className="min-w-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                        >
                            <h1 className="truncate text-base font-semibold tracking-tight text-slate-900 md:text-[17px]">
                                {currentPage.title}
                            </h1>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {
                // Right section: authenticated user account badge
            }
            <div className="flex shrink-0 items-center text-xs sm:text-sm text-slate-600">
                <span>Welcome,&nbsp;</span>
                <span className="font-bold text-slate-900 truncate max-w-[220px] sm:max-w-none">
                    {user?.name || 'User'}
                </span>
            </div>
        </motion.header>
    );
}
