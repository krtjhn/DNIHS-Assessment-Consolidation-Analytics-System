import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    BookOpen,
    CheckCircle2,
    Clock,
    FileCheck2,
    GraduationCap,
    RefreshCw,
    TrendingUp,
    Users,
    ShieldAlert,
    ChevronDown,
    ChevronUp,
    Layers,
    Sparkles,
} from 'lucide-react';
import { api } from '../../api';
import LoadingIndicator from '../../components/LoadingIndicator';

// DepEd Official 7-Bracket Verbal Interpretation badge styling helper
function getMasteryBadgeClass(masteryLevel) {
    switch (masteryLevel) {
        case 'Mastered':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'Closely Approximating Mastery':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'Moving Towards Mastery':
            return 'bg-sky-50 text-sky-700 border-sky-200';
        case 'Average':
            return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'Low':
            return 'bg-orange-50 text-orange-700 border-orange-200';
        case 'Very Low':
            return 'bg-rose-50 text-rose-700 border-rose-200';
        case 'Absolutely No Mastery':
            return 'bg-red-100 text-red-800 border-red-300';
        default:
            return 'bg-slate-50 text-slate-700 border-slate-200';
    }
}

// Executive Overview & Decision Support System (DSS) Dashboard
export default function OverviewDashboard({ onNavigateToConsolidation, onNavigateToAssignments }) {
    // 1. State Management
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // Selected temporal filters
    const [selectedSYId, setSelectedSYId] = useState('');
    const [selectedTermId, setSelectedTermId] = useState('');

    // Dashboard payload state
    const [dssData, setDssData] = useState(null);
    const [showPendingDrawer, setShowPendingDrawer] = useState(false);

    // 2. Fetch Dashboard Data
    async function loadDashboardData(syId = selectedSYId, termId = selectedTermId, isRefresh = false) {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const queryParams = new URLSearchParams();
            if (syId) queryParams.append('school_year_id', syId);
            if (termId) queryParams.append('term_id', termId);

            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
            const res = await api.get(`/dss/overview${queryString}`);

            if (res && res.data) {
                setDssData(res.data);
                if (!syId && res.data.active_school_year) {
                    setSelectedSYId(String(res.data.active_school_year.id));
                }
                if (!termId && res.data.active_term) {
                    setSelectedTermId(String(res.data.active_term.id));
                }
            }
        } catch (err) {
            setError(err?.message || 'Failed to load Decision Support System overview analytics.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    // Initial Load
    useEffect(() => {
        loadDashboardData('', '');
    }, []);

    // Handle Period Filter Changes
    function handleSchoolYearChange(newSYId) {
        setSelectedSYId(newSYId);
        // Find default active or first term of that school year
        const selectedSY = dssData?.all_school_years?.find((sy) => String(sy.id) === String(newSYId));
        const defaultTerm = selectedSY?.terms?.find((t) => t.status === 'active') || selectedSY?.terms?.[0];
        const newTermId = defaultTerm ? String(defaultTerm.id) : '';
        setSelectedTermId(newTermId);
        loadDashboardData(newSYId, newTermId);
    }

    function handleTermChange(newTermId) {
        setSelectedTermId(newTermId);
        loadDashboardData(selectedSYId, newTermId);
    }

    // Full screen loading indicator on initial mount
    if (loading && !dssData) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
                <LoadingIndicator type="dot-circle" size="lg" label="Compiling Decision Support Analytics..." />
                <p className="text-xs font-medium text-slate-500">Evaluating institutional KPIs and early warnings across classes</p>
            </div>
        );
    }

    const kpis = dssData?.kpis || {};
    const atRiskClasses = dssData?.at_risk_classes || [];
    const subjectMastery = dssData?.subject_mastery_matrix || [];
    const gradeBreakdown = dssData?.grade_level_breakdown || [];
    const growth = dssData?.growth_analytics || null;
    const pendingSubmissions = dssData?.pending_submissions || [];
    const recentSubmissions = dssData?.recent_submissions || [];
    const allSchoolYears = dssData?.all_school_years || [];
    const activeSY = dssData?.active_school_year;
    const activeTerm = dssData?.active_term;

    const selectedSYObj = allSchoolYears.find((sy) => String(sy.id) === String(selectedSYId)) || activeSY;
    const availableTerms = selectedSYObj?.terms || [];

    return (
        <div className="space-y-6 pb-12">
            {
                // Top Header Strip: Academic Scoping & Temporal Filtering Controls
            }
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="flex size-7 items-center justify-center rounded-lg bg-[#0071e3]/10 text-[#0071e3]">
                                <Activity className="size-4" />
                            </span>
                            <h2 className="text-lg font-bold tracking-tight text-slate-900">
                                Institutional Decision Support System (DSS)
                            </h2>
                            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-200">
                                v2 Analytics Engine
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Academic monitoring, early warning indicators, and consolidated performance for Digos National High School.
                        </p>
                    </div>

                    {
                        // Academic Period Selector (School Year + Term)
                    }
                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">School Year:</span>
                            <select
                                value={selectedSYId}
                                onChange={(e) => handleSchoolYearChange(e.target.value)}
                                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                            >
                                {allSchoolYears.map((sy) => (
                                    <option key={sy.id} value={sy.id}>
                                        {sy.name} {sy.is_active ? '(Active)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Term:</span>
                            <select
                                value={selectedTermId}
                                onChange={(e) => handleTermChange(e.target.value)}
                                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                            >
                                {availableTerms.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} ({t.status})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={() => loadDashboardData(selectedSYId, selectedTermId, true)}
                            disabled={refreshing}
                            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50"
                            title="Reload latest data"
                        >
                            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin text-[#0071e3]' : ''}`} />
                            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
                        <AlertTriangle className="size-4 shrink-0 text-rose-600" />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {
                // Section 1: Executive KPI Strip (4 Pillars)
            }
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {
                    // KPI 1: School-Wide Consolidated MPS
                }
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overall MPS</span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${getMasteryBadgeClass(kpis.overall_mastery)}`}>
                            {kpis.overall_mastery || 'Calculating'}
                        </span>
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900">
                            {Number(kpis.overall_mps || 0).toFixed(2)}%
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Arithmetic Mean: <span className="font-semibold text-slate-700">{Number(kpis.overall_mean || 0).toFixed(2)}</span> / 50 pts
                        </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Benchmark Standard:</span>
                        <span className={`font-bold ${kpis.overall_mps >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {kpis.overall_mps >= 75 ? '>= 75% Met' : 'Below 75% Target'}
                        </span>
                    </div>
                </motion.div>

                {
                    // KPI 2: Total Assessed Examinees
                }
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                    className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Examinees</span>
                        <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                            <Users className="size-4" />
                        </span>
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900">
                            {Number(kpis.total_examinees || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Students evaluated across <span className="font-semibold text-slate-700">{kpis.submitted_classes_count || 0}</span> score sheets
                        </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Population Std Dev:</span>
                        <span className="font-bold text-slate-700">σ = {Number(kpis.overall_sd || 0).toFixed(2)}</span>
                    </div>
                </motion.div>

                {
                    // KPI 3: Faculty Encoding Submission Progress
                }
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Submission Rate</span>
                        <span className="text-xs font-extrabold text-[#0071e3]">
                            {kpis.submission_rate || 0}%
                        </span>
                    </div>
                    <div className="mt-3">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                                {kpis.submitted_classes_count || 0}
                            </span>
                            <span className="text-sm font-semibold text-slate-400">
                                / {kpis.total_expected_classes || 0} classes
                            </span>
                        </div>
                        {
                            // Visual progress bar
                        }
                        <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                            <div
                                className="bg-[#0071e3] h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, kpis.submission_rate || 0)}%` }}
                            />
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Pending Submissions:</span>
                        <button
                            type="button"
                            onClick={() => setShowPendingDrawer((prev) => !prev)}
                            className="font-bold text-[#0071e3] hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                            <span>{kpis.pending_classes_count || 0} Pending</span>
                            {showPendingDrawer ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                        </button>
                    </div>
                </motion.div>

                {
                    // KPI 4: Early Warning / At-Risk Classes
                }
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.15 }}
                    className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">At-Risk Alerts</span>
                        <span className={`flex size-7 items-center justify-center rounded-lg ${kpis.at_risk_count > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-600'}`}>
                            {kpis.at_risk_count > 0 ? <AlertTriangle className="size-4" /> : <CheckCircle2 className="size-4" />}
                        </span>
                    </div>
                    <div className="mt-3">
                        <div className={`text-3xl font-extrabold tracking-tight ${kpis.at_risk_count > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {kpis.at_risk_count || 0}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {kpis.at_risk_count > 0
                                ? 'Classes requiring remediation (MPS < 75%)'
                                : 'All classes met DepEd mastery benchmark!'}
                        </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Early Warning Threshold:</span>
                        <span className="font-bold text-slate-700">DepEd 75.0% Baseline</span>
                    </div>
                </motion.div>
            </div>

            {
                // Collapsible Drawer: Pending Faculty Submissions
            }
            <AnimatePresence>
                {showPendingDrawer && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                                <Clock className="size-4 text-amber-700" />
                                <span>Faculty Submissions Pending for {activeTerm?.name || 'Current Term'}</span>
                            </div>
                            <span className="text-xs text-amber-800 font-medium">
                                Total Pending: {pendingSubmissions.length}
                            </span>
                        </div>

                        {pendingSubmissions.length === 0 ? (
                            <p className="text-xs text-emerald-700 font-medium py-2">
                                All faculty members have completed and submitted their assessment score sheets!
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {pendingSubmissions.map((p, idx) => (
                                    <div key={idx} className="bg-white rounded-xl p-3 border border-amber-200/70 shadow-2xs">
                                        <div className="font-bold text-xs text-slate-900">{p.teacher_name}</div>
                                        <div className="text-[11px] text-slate-500">{p.teacher_email}</div>
                                        <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-700 border-t border-slate-100 pt-1.5">
                                            <span>{p.grade_level} - {p.section_name}</span>
                                            <span className="text-[#0071e3] font-mono">{p.subject_code}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {
                // Section 2: Early Warning Radar (At-Risk Identification Table)
            }
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                            <ShieldAlert className="size-4" />
                        </span>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Early Warning Radar (At-Risk & Polarized Classes)</h3>
                            <p className="text-xs text-slate-500">
                                Priority attention queue for classes below the DepEd 75% baseline or experiencing high score polarization.
                            </p>
                        </div>
                    </div>
                    {atRiskClasses.length > 0 && (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200 self-start sm:self-auto">
                            {atRiskClasses.length} Classes Require Attention
                        </span>
                    )}
                </div>

                {atRiskClasses.length === 0 ? (
                    <div className="py-8 flex flex-col items-center justify-center text-center">
                        <div className="size-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                            <CheckCircle2 className="size-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">Zero Critical Learning Emergencies</h4>
                        <p className="text-xs text-slate-500 max-w-md mt-1">
                            All encoded classes in {activeTerm?.name || 'this term'} have successfully achieved or exceeded the DepEd 75% Mean Percentage Score (MPS) mastery threshold.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                                <tr>
                                    <th className="py-2.5 px-3">Class & Section</th>
                                    <th className="py-2.5 px-3">Learning Area</th>
                                    <th className="py-2.5 px-3">Assigned Teacher</th>
                                    <th className="py-2.5 px-3 text-right">Mean</th>
                                    <th className="py-2.5 px-3 text-right">MPS (%)</th>
                                    <th className="py-2.5 px-3 text-right">Std Dev (σ)</th>
                                    <th className="py-2.5 px-3">Mastery Descriptor</th>
                                    <th className="py-2.5 px-3">Primary Diagnosis / Trigger</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {atRiskClasses.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-2.5 px-3 font-bold text-slate-900">
                                            {item.grade_level} — {item.section_name}
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span className="font-mono font-bold text-[#0071e3]">{item.subject_code}</span>
                                            <span className="text-slate-400 text-[11px] ml-1.5">({item.subject_name})</span>
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-800">{item.teacher_name}</td>
                                        <td className="py-2.5 px-3 text-right font-mono font-semibold">{item.mean.toFixed(2)}</td>
                                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600">
                                            {item.mps.toFixed(2)}%
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">{item.sd.toFixed(2)}</td>
                                        <td className="py-2.5 px-3">
                                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold border ${getMasteryBadgeClass(item.mastery_level)}`}>
                                                {item.mastery_level}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <div className="flex flex-col gap-0.5">
                                                {item.reasons.map((r, i) => (
                                                    <span key={i} className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                                                        <span className="size-1 rounded-full bg-rose-500" />
                                                        {r}
                                                    </span>
                                                ))}
                                                {item.least_learned_competency && (
                                                    <span className="text-[10px] text-slate-400 italic">
                                                        Focus: {item.least_learned_competency}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {
                // Section 3: Diagnostic vs. Term Exam Value-Added Analytics & Subject Matrix
            }
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {
                    // Left 5 Columns: Diagnostic vs Term Exam Value-Added Analytics
                }
                <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
                    <div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                    <TrendingUp className="size-4" />
                                </span>
                                <h3 className="text-sm font-bold text-slate-900">Value-Added Learning Growth</h3>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                Diagnostic vs Exam
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Measures institutional progress from initial diagnostic baseline to quarterly examination.
                        </p>
                    </div>

                    {growth && growth.has_comparison ? (
                        <div className="space-y-4 my-auto">
                            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                                <div>
                                    <span className="text-[11px] font-bold text-slate-500 uppercase">Diagnostic Baseline</span>
                                    <div className="text-2xl font-black text-slate-800 mt-1">
                                        {growth.diagnostic_mps.toFixed(2)}%
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                        {growth.diagnostic_mastery}
                                    </div>
                                </div>
                                <div className="border-l border-slate-200 pl-3">
                                    <span className="text-[11px] font-bold text-[#0071e3] uppercase">Term Examination</span>
                                    <div className="text-2xl font-black text-[#0071e3] mt-1">
                                        {growth.term_exam_mps.toFixed(2)}%
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                        {growth.term_exam_mastery}
                                    </div>
                                </div>
                            </div>

                            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                                growth.growth_delta >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                            }`}>
                                <div className="flex items-center gap-2">
                                    {growth.growth_delta >= 0 ? <ArrowUpRight className="size-5 text-emerald-600" /> : <ArrowDownRight className="size-5 text-rose-600" />}
                                    <div>
                                        <div className="text-xs font-bold">
                                            {growth.growth_delta >= 0 ? 'Positive Academic Gain' : 'Mastery Regression'}
                                        </div>
                                        <div className="text-[11px] opacity-80">
                                            Net change across all evaluated examinees
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xl font-black font-mono">
                                    {growth.growth_delta > 0 ? `+${growth.growth_delta}%` : `${growth.growth_delta}%`}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 rounded-xl p-4 text-center my-auto border border-dashed border-slate-200">
                            <Clock className="size-6 text-slate-400 mx-auto mb-1.5" />
                            <h4 className="text-xs font-bold text-slate-800">Growth Tracking Standby</h4>
                            <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                                Requires both Diagnostic and Term Examination score sheets for this academic period to compute value-added delta metrics.
                            </p>
                        </div>
                    )}

                    <div className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-100">
                        Formula: Value Added = Term Exam MPS - Diagnostic Baseline MPS
                    </div>
                </div>

                {
                    // Right 7 Columns: Cross-Grade Subject Area Mastery Matrix
                }
                <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="flex size-7 items-center justify-center rounded-lg bg-[#0071e3]/10 text-[#0071e3]">
                                <BookOpen className="size-4" />
                            </span>
                            <h3 className="text-sm font-bold text-slate-900">Subject Area Performance Matrix</h3>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                            Ranked from highest to lowest
                        </span>
                    </div>

                    {subjectMastery.length === 0 ? (
                        <p className="text-xs text-slate-400 py-6 text-center">No subject records encoded yet for this period.</p>
                    ) : (
                        <div className="space-y-3">
                            {subjectMastery.map((subj, idx) => (
                                <div key={idx} className="bg-slate-50/70 rounded-xl p-3 border border-slate-100 flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900">{subj.subject_name}</span>
                                            <span className="text-[11px] text-slate-500 font-mono">({subj.classes_count} classes)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-slate-900">{subj.average_mps.toFixed(2)}%</span>
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.2 text-[10px] font-bold border ${getMasteryBadgeClass(subj.mastery_level)}`}>
                                                {subj.mastery_level}
                                            </span>
                                        </div>
                                    </div>
                                    {
                                        // Visual horizontal bar
                                    }
                                    <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-500 ${subj.is_benchmark_met ? 'bg-[#0071e3]' : 'bg-amber-500'}`}
                                            style={{ width: `${Math.min(100, subj.average_mps)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {
                // Section 4: Grade Level Comparative Breakdown (Grades 7, 8, 9, 10)
            }
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                            <Layers className="size-4" />
                        </span>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Grade Level Comparative Consolidation</h3>
                            <p className="text-xs text-slate-500">School-wide academic standing grouped by Junior High School grade levels.</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {gradeBreakdown.map((gb) => (
                        <div
                            key={gb.level}
                            className={`rounded-xl p-4 border transition-all ${
                                gb.classes_count > 0 ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-50/50 border-dashed border-slate-200 text-slate-400'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">{gb.display_name}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getMasteryBadgeClass(gb.mastery_level)}`}>
                                    {gb.mastery_level}
                                </span>
                            </div>

                            <div className="mt-3">
                                <div className="text-2xl font-black text-slate-900 font-mono">
                                    {gb.overall_mps.toFixed(2)}%
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                    {gb.total_examinees} Students evaluated ({gb.classes_count} classes)
                                </div>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                <span className="text-slate-500">Benchmark:</span>
                                <span className={`font-semibold ${gb.is_benchmark_met ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {gb.is_benchmark_met ? '>= 75% Met' : '< 75% Below'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {
                // Section 5: Recent Activity & Quick Navigation
            }
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                        <Sparkles className="size-5" />
                    </span>
                    <div>
                        <h4 className="text-xs font-bold text-slate-900">Need detailed tabular reports or Table of Specifications?</h4>
                        <p className="text-[11px] text-slate-500">
                            Jump straight to the multi-section pooled variance report or manage faculty workload allocations.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {onNavigateToConsolidation && (
                        <button
                            type="button"
                            onClick={onNavigateToConsolidation}
                            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            Open Consolidated Reports
                        </button>
                    )}
                    {onNavigateToAssignments && (
                        <button
                            type="button"
                            onClick={onNavigateToAssignments}
                            className="rounded-xl bg-[#0071e3] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0077ed] transition-colors cursor-pointer shadow-xs"
                        >
                            Manage Class Allocations
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
