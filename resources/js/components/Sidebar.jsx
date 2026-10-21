import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    ClipboardList,
    BarChart3,
    Layers,
    BookOpen,
    CalendarDays,
    Users,
    LogOut,
} from 'lucide-react';
import schoolLogo from '../../logo.png';

const iconMap = {
    records: ClipboardList,
    consolidation: BarChart3,
    sections: Layers,
    assignments: BookOpen,
    calendar: CalendarDays,
    teachers: Users,
    logout: LogOut,
};

// Navigation icon mapper helper component
function NavIcon({ name, className = 'size-5' }) {
    const IconComponent = iconMap[name] || ClipboardList;
    return <IconComponent className={className} strokeWidth={1.85} aria-hidden="true" />;
}

// Sidebar toggle icon matching Apple HIG panel-left design
export function SidebarToggleIcon({ className = 'size-5' }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <line x1="8.5" y1="7.5" x2="8.5" y2="16.5" strokeWidth="2.2" />
        </svg>
    );
}

// Navigation routes for Teacher role
const teacherNavItems = [
    { id: 'records', label: 'Record Entry', icon: 'records' },
];

// Navigation routes for Administrator role
const adminNavItems = [
    { id: 'consolidation', label: 'Consolidated Reports', icon: 'consolidation' },
    { id: 'sections', label: 'Section Management', icon: 'sections' },
    { id: 'assignments', label: 'Class Assignments', icon: 'assignments' },
    { id: 'calendar', label: 'School Calendar', icon: 'calendar' },
    { id: 'teachers', label: 'Teacher Accounts', icon: 'teachers' },
];

// Main Sidebar navigation component
export default function Sidebar({
    activeTab,
    setActiveTab,
    isAdmin,
    onLogout,
    isCollapsed,
    onToggleCollapse,
    isMobileOpen,
    onCloseMobile,
    activeSYName = '2025–2026',
    activeTermName = '1st Term',
}) {
    const navItems = isAdmin ? adminNavItems : teacherNavItems;

    return (
        <>
            {
                // Mobile backdrop overlay
            }
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

            {
                // Sidebar container with desktop collapsible toggle and mobile slide-in
            }
            <aside
                className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-slate-200/80 bg-white transition-all duration-300 ease-in-out ${
                    isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                } ${isCollapsed ? 'w-[72px]' : 'w-72'}`}
            >
                {
                    // Brand header with seal, institutional title, and toggle icon button
                }
                <div
                    className={`flex h-16 shrink-0 items-center transition-all ${
                        isCollapsed ? 'justify-center px-0' : 'justify-between gap-2 px-3.5'
                    }`}
                >
                    {isCollapsed ? (
                        <motion.button
                            type="button"
                            onClick={onToggleCollapse}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.94 }}
                            className="flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/40 cursor-pointer"
                            aria-label="Expand sidebar"
                            title="Expand sidebar"
                        >
                            <SidebarToggleIcon className="size-5" />
                        </motion.button>
                    ) : (
                        <>
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <motion.img
                                    src={schoolLogo}
                                    alt="Dayap National Integrated High School seal"
                                    className="size-9 shrink-0 object-contain"
                                    whileHover={{ rotate: 10, scale: 1.05 }}
                                    transition={{ type: 'spring', stiffness: 300 }}
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
                                        DNIHS
                                    </div>
                                    <div className="text-[10px] font-medium text-slate-500 leading-tight mt-0.5 whitespace-normal">
                                        Consolidation & Analytics System
                                    </div>
                                </div>
                            </div>
                            <motion.button
                                type="button"
                                onClick={() => {
                                    if (isMobileOpen) {
                                        onCloseMobile?.();
                                    } else {
                                        onToggleCollapse?.();
                                    }
                                }}
                                whileHover={{ scale: 1.06 }}
                                whileTap={{ scale: 0.94 }}
                                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/40 cursor-pointer"
                                aria-label="Collapse sidebar"
                                title="Collapse sidebar"
                            >
                                <SidebarToggleIcon className="size-5" />
                            </motion.button>
                        </>
                    )}
                </div>

                {
                    // Navigation links list
                }
                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
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
                                        ? 'text-[#0071e3]'
                                        : 'text-slate-700 hover:bg-slate-100/70 hover:text-slate-900'
                                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active-indicator"
                                        className="absolute inset-0 rounded-xl bg-[#0071e3]/15"
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

                {
                    // Active academic term and school year indicator
                }
                <div className="p-2 sm:p-3">
                    {!isCollapsed && (
                        <div className="px-3 pb-2 text-[11px] text-slate-500 font-medium select-none truncate">
                            <span>SY {activeSYName}</span>
                            <span className="mx-1.5 text-slate-300">•</span>
                            <span>{activeTermName}</span>
                        </div>
                    )}
                    <motion.button
                        type="button"
                        onClick={onLogout}
                        title="Sign Out"
                        whileHover={{ x: isCollapsed ? 0 : 3 }}
                        whileTap={{ scale: 0.97 }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors duration-150 ${
                            isCollapsed ? 'justify-center px-0' : ''
                        }`}
                        aria-label="Sign out"
                    >
                        <NavIcon name="logout" className="size-5 shrink-0" />
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.15 }}
                            >
                                Sign Out
                            </motion.span>
                        )}
                    </motion.button>
                </div>
            </aside>
        </>
    );
}
