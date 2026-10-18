import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import schoolLogo from '../../logo.png';

function NavIcon({ name }) {
    const paths = {
        records: (
            <>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                <path d="M9 7h7M9 11h7" />
            </>
        ),
        sections: (
            <>
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
            </>
        ),
        consolidation: (
            <>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
            </>
        ),
        calendar: (
            <>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </>
        ),
        assignments: (
            <>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </>
        ),
        teachers: (
            <>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </>
        ),
        logout: (
            <>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
            </>
        ),
    };

    return (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {paths[name] || paths.records}
        </svg>
    );
}

const teacherNavItems = [
    { id: 'records', label: 'Record Entry', icon: 'records' },
];

const adminNavItems = [
    { id: 'consolidation', label: 'Consolidated Reports', icon: 'consolidation' },
    { id: 'sections', label: 'Section Management', icon: 'sections' },
    { id: 'assignments', label: 'Class Assignments', icon: 'assignments' },
    { id: 'calendar', label: 'School Calendar', icon: 'calendar' },
    { id: 'teachers', label: 'Teacher Accounts', icon: 'teachers' },
];

export default function Sidebar({
    activeTab,
    setActiveTab,
    isAdmin,
    user,
    onLogout,
    isCollapsed,
    isMobileOpen,
    onCloseMobile,
}) {
    const navItems = isAdmin ? adminNavItems : teacherNavItems;

    return (
        <>
            {/* Mobile backdrop */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
                        onClick={onCloseMobile}
                        aria-hidden="true"
                    />
                )}
            </AnimatePresence>

            <aside
                className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-slate-200/80 bg-white transition-all duration-300 ease-in-out ${
                    isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                } ${isCollapsed ? 'w-[72px]' : 'w-64'}`}
            >
                {/* School Logo & Title */}
                <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 px-4">
                    <motion.img
                        src={schoolLogo}
                        alt="Dayap National Integrated High School seal"
                        className="size-9 shrink-0 object-contain"
                        whileHover={{ rotate: 10, scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    />
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -6 }}
                            transition={{ duration: 0.15 }}
                            className="min-w-0"
                        >
                            <div className="truncate text-xs font-bold tracking-tight text-slate-900 leading-tight">
                                Dayap NIHS
                            </div>
                            <div className="truncate text-[10px] font-medium text-slate-500">
                                Assessment Monitoring
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    <div className={`px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 ${isCollapsed ? 'text-center' : ''}`}>
                        {isCollapsed ? '•••' : 'Academic Modules'}
                    </div>

                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <motion.button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    setActiveTab(item.id);
                                    onCloseMobile?.();
                                }}
                                title={item.label}
                                whileHover={{ x: isCollapsed ? 0 : 3 }}
                                whileTap={{ scale: 0.97 }}
                                className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors duration-150 ${
                                    isActive
                                        ? 'text-white'
                                        : 'text-slate-700 hover:bg-slate-100/70 hover:text-slate-900'
                                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active-indicator"
                                        className="absolute inset-0 rounded-xl bg-[#0071e3] shadow-sm shadow-blue-500/25"
                                        transition={{
                                            type: 'spring',
                                            stiffness: 450,
                                            damping: 35,
                                        }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-3">
                                    <NavIcon name={item.icon} />
                                    {!isCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </span>
                            </motion.button>
                        );
                    })}
                </nav>

                {/* Footer User Info & Sign Out */}
                <div className="border-t border-slate-100 p-3">
                    <div className={`flex items-center gap-3 rounded-xl p-2 bg-slate-50/80 border border-slate-200/60 ${isCollapsed ? 'justify-center' : ''}`}>
                        <motion.div
                            whileHover={{ scale: 1.08 }}
                            className="size-8 shrink-0 rounded-full bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center font-bold text-xs"
                        >
                            {user?.name?.slice(0, 2).toUpperCase() || 'U'}
                        </motion.div>
                        {!isCollapsed && (
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-xs font-bold text-slate-800">{user?.name}</div>
                                <div className="truncate text-[10px] text-slate-500 font-medium capitalize">
                                    {isAdmin ? 'System Admin' : 'Teacher'}
                                </div>
                            </div>
                        )}
                        <motion.button
                            type="button"
                            onClick={onLogout}
                            title="Sign Out"
                            whileHover={{ scale: 1.15, rotate: 6 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            aria-label="Sign out"
                        >
                            <NavIcon name="logout" />
                        </motion.button>
                    </div>
                </div>
            </aside>
        </>
    );
}
