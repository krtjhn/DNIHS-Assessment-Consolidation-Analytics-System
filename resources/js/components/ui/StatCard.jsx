import React from 'react';

// + Apple Fitness/Analytics Metric Card Component
export function StatCard({ label, value, subtext, icon: Icon, badge, color = 'blue' }) {
    const iconColors = {
        blue: 'text-[#0071E3] bg-blue-50',
        emerald: 'text-emerald-600 bg-emerald-50',
        amber: 'text-amber-600 bg-amber-50',
        purple: 'text-purple-600 bg-purple-50',
    };

    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{label}</span>
                {Icon && (
                    <div className={`p-2 rounded-xl ${iconColors[color] || iconColors.blue}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                )}
            </div>

            <div className="mt-4">
                <div className="text-3xl font-bold tracking-tight text-slate-900">{value}</div>
                {(subtext || badge) && (
                    <div className="mt-2 flex items-center gap-2">
                        {badge}
                        {subtext && <span className="text-xs text-slate-500">{subtext}</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
