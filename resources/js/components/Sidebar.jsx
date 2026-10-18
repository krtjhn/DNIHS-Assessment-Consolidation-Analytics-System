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

function NavIcon({ name, className = 'size-5' }) {
    const IconComponent = iconMap[name] || ClipboardList;
    return <IconComponent className={className} strokeWidth={1.85} aria-hidden="true" />;
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
                <div
                    className={`flex h-16 shrink-0 items-center border-b border-slate-100 transition-all ${
                        isCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'
                    }`}
                >
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
                            className="min-w-0 flex-1"
                        >
                            <div className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
                                DNIHS
                            </div>
                            <div className="text-[10px] font-medium text-slate-500 leading-tight mt-0.5">
                                Assessment Consolidation & Analytics System
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Navigation Links */}
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

                {/* Footer Sign Out */}
                <div className="border-t border-slate-100 p-2 sm:p-3">
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
