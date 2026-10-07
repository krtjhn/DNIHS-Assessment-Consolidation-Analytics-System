import React from 'react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { School, LogOut, Layers, Calculator, UserCheck } from 'lucide-react';

// + Apple HIG Translucent Navigation Bar
export function Navbar({ user, activeTab, onTabChange, onLogout }) {
    const isAdmin = user?.roles?.some((r) => r.name === 'system_admin');
    const isTeacher = user?.roles?.some((r) => r.name === 'teacher');

    return (
        <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-white/80 border-b border-slate-200/80 transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* + School Branding & Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0071E3] to-blue-700 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
                            <School className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-semibold text-sm sm:text-base text-slate-900 leading-tight">
                                Dayap NHS - Calauan Annex
                            </div>
                            <div className="text-xs text-slate-500 font-normal">
                                Assessment Analytics System
                            </div>
                        </div>
                    </div>

                    {/* + Apple Segmented Pill Navigation */}
                    <div className="hidden md:flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={() => onTabChange('sections')}
                                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
                                    activeTab === 'sections'
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Layers className="w-3.5 h-3.5 text-[#0071E3]" />
                                Sections (Entity 1)
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => onTabChange('assessments')}
                            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
                                activeTab === 'assessments'
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Calculator className="w-3.5 h-3.5 text-[#0071E3]" />
                            DepEd Stats & Scores (Entity 2)
                        </button>
                    </div>

                    {/* + User Profile & Logout Action */}
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-xs font-medium text-slate-800">{user?.name}</span>
                            <Badge variant={isAdmin ? 'admin' : 'teacher'}>
                                {isAdmin ? 'System Admin' : 'Teacher'}
                            </Badge>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onLogout}
                            className="text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Sign Out</span>
                        </Button>
                    </div>
                </div>

                {/* + Mobile Segmented Tab Bar */}
                <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100">
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={() => onTabChange('sections')}
                            className={`flex-1 py-1.5 text-xs font-medium text-center rounded-lg ${
                                activeTab === 'sections' ? 'bg-slate-200/80 text-slate-900' : 'text-slate-500'
                            }`}
                        >
                            Sections
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => onTabChange('assessments')}
                        className={`flex-1 py-1.5 text-xs font-medium text-center rounded-lg ${
                            activeTab === 'assessments' ? 'bg-slate-200/80 text-slate-900' : 'text-slate-500'
                        }`}
                    >
                        Assessments & Stats
                    </button>
                </div>
            </div>
        </header>
    );
}
