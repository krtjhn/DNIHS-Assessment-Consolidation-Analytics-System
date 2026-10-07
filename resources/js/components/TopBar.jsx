import React from 'react';

export default function TopBar({
    user,
    activeTab,
    activeSYName = '2025-2026',
    activeTermName = 'First Term',
    onToggleSidebar,
    onOpenMobileSidebar,
}) {
    const pageDetails = {
        records: { title: 'Record Entry', eyebrow: 'Academic Records' },
        consolidation: { title: 'Consolidated Performance Reports', eyebrow: 'Analytics & Reporting' },
        sections: { title: 'Section Management', eyebrow: 'Administration' },
        assignments: { title: 'Teacher Class Assignments', eyebrow: 'Faculty Workload' },
        calendar: { title: 'School Calendar & Terms', eyebrow: 'Academic Settings' },
        teachers: { title: 'Faculty Accounts Management', eyebrow: 'User Administration' },
    };

    const currentPage = pageDetails[activeTab] || pageDetails.records;
    const roleName = user?.roles?.[0]?.display_name || (user?.roles?.[0]?.name === 'system_admin' ? 'System Administrator' : 'Faculty / Teacher');

    const initials = (user?.name || 'User')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();

    return (
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-xs md:px-6">
            {/* Left: Sidebar Toggles & Active Page Title */}
            <div className="flex min-w-0 items-center gap-3">
                {/* Mobile Menu Toggle Button */}
                <button
                    type="button"
                    onClick={onOpenMobileSidebar}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/40 md:hidden"
                    aria-label="Open navigation menu"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                {/* Desktop Sidebar Collapse Toggle */}
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="hidden size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/40 md:flex"
                    aria-label="Toggle sidebar navigation"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <div className="min-w-0">
                    <div className="truncate text-[10px] font-semibold uppercase tracking-wider text-[#0071e3]">
                        {currentPage.eyebrow}
                    </div>
                    <h1 className="truncate text-base font-semibold tracking-tight text-slate-900 md:text-[17px]">
                        {currentPage.title}
                    </h1>
                </div>
            </div>

            {/* Center: Active Academic Year and Active Term Badge */}
            <div className="hidden min-w-0 flex-1 justify-center lg:flex">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-slate-50 px-3.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
                    <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                    <span>SY {activeSYName}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[#0071e3]">{activeTermName}</span>
                </div>
            </div>

            {/* Right: Authenticated User Chip */}
            <div className="flex shrink-0 items-center gap-3">
                <div className="hidden text-right sm:block">
                    <div className="text-xs font-bold text-slate-900">{user?.name}</div>
                    <div className="text-[10px] font-medium text-slate-500">{roleName}</div>
                </div>

                <div
                    title={user?.name}
                    className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-[#0071e3] to-blue-600 text-xs font-bold text-white shadow-2xs"
                >
                    {initials}
                </div>
            </div>
        </header>
    );
}
