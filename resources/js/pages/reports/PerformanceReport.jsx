import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../api';

/**
 * Filter Pill Component
 */
function FilterPill({ icon, label, value, displayValue, options, onChange, onClear, disabled = false }) {
    const isFiltered = Boolean(value);

    return (
        <div
            className={`group relative inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-all has-[:focus-visible]:border-[#0071e3] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#0071e3]/40 ${
                isFiltered
                    ? 'border-[#0071e3]/30 bg-blue-50/80 text-[#0071e3] shadow-2xs'
                    : 'border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
            } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
            <span className="pointer-events-none text-slate-400 flex items-center" aria-hidden="true">{icon}</span>
            {label && <span className="pointer-events-none text-slate-500 font-medium">{label}:</span>}
            <span className={`pointer-events-none truncate max-w-[140px] ${isFiltered ? 'font-semibold text-slate-900' : 'text-slate-800'}`}>
                {displayValue}
            </span>

            {!disabled && (
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 size-full cursor-pointer opacity-0 focus-visible:outline-none"
                    title={`${label ? `${label}: ` : ''}${displayValue}`}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            )}

            {isFiltered && onClear ? (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClear();
                    }}
                    className="relative z-10 -mr-1 ml-0.5 flex size-4 items-center justify-center rounded-full text-blue-500 hover:bg-blue-200 hover:text-blue-900 transition text-[11px] font-bold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0071e3]"
                    aria-label={`Clear ${label || 'filter'}`}
                    title="Clear filter"
                >
                    ✕
                </button>
            ) : (
                <span className="pointer-events-none -mr-0.5 text-slate-400 group-hover:text-slate-600 transition" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </span>
            )}
        </div>
    );
}

/**
 * Metric Card
 */
function MetricCard({ title, value, subtitle, badge, badgeColor }) {
    return (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</span>
                {badge && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {badge}
                    </span>
                )}
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</div>
            {subtitle && <p className="mt-1 text-xs text-slate-500 font-medium">{subtitle}</p>}
        </div>
    );
}

export default function PerformanceReport() {
    // 1. Core Reference Data
    const [schoolYears, setSchoolYears] = useState([]);
    const [terms, setTerms] = useState([]);
    const [gradeLevels, setGradeLevels] = useState([]);
    const [sections, setSections] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [refLoading, setRefLoading] = useState(true);

    // 2. Active Selection Filters
    const [assessmentType, setAssessmentType] = useState('term_exam'); // 'term_exam' | 'diagnostic'
    const [selectedSYId, setSelectedSYId] = useState('');
    const [selectedTermId, setSelectedTermId] = useState('');
    const [selectedGradeId, setSelectedGradeId] = useState('');
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [selectedSubjectName, setSelectedSubjectName] = useState('');

    // 3. Consolidated Data State
    const [consolidationData, setConsolidationData] = useState(null);
    const [loadingData, setLoadingData] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Load reference data on mount
    useEffect(() => {
        loadReferenceData();
    }, []);

    async function loadReferenceData() {
        setRefLoading(true);
        try {
            const [refs, sectionsRes] = await Promise.all([
                api.get('/reference-data'),
                api.get('/sections'),
            ]);

            const syList = refs.school_years || [];
            const termList = syList.flatMap((sy) => sy.terms || []);
            const gradeList = refs.grade_levels || [];
            const secList = sectionsRes.data || [];
            const subjList = refs.subjects || [];

            setSchoolYears(syList);
            setTerms(termList);
            setGradeLevels(gradeList);
            setSections(secList);
            setSubjects(subjList);

            // Defaults
            const activeSY = refs.active_sy || syList[0];
            if (activeSY) {
                setSelectedSYId(String(activeSY.id));
                const activeTerm = (activeSY.terms || []).find((t) => t.status === 'active') || activeSY.terms?.[0];
                if (activeTerm) setSelectedTermId(String(activeTerm.id));
            }
        } catch (err) {
            console.error('Error loading reference data:', err);
            setErrorMessage('Unable to load initial academic reference data.');
        } finally {
            setRefLoading(false);
        }
    }

    // Fetch consolidation when scope changes
    useEffect(() => {
        if (selectedSYId && selectedTermId) {
            fetchConsolidation();
        }
    }, [assessmentType, selectedSYId, selectedTermId, selectedGradeId]);

    async function fetchConsolidation() {
        setLoadingData(true);
        setErrorMessage('');
        try {
            const mappedType = assessmentType === 'term_exam' ? 'quarterly' : 'diagnostic';
            const params = new URLSearchParams({
                school_year_id: selectedSYId,
                term_id: selectedTermId,
                type: mappedType,
            });
            if (selectedGradeId) {
                params.set('grade_level_id', selectedGradeId);
            }

            const res = await api.get(`/assessments/consolidation?${params.toString()}`);
            setConsolidationData(res);
        } catch (err) {
            console.error('Error fetching consolidation:', err);
            setErrorMessage(err.message || 'Unable to load consolidation records.');
        } finally {
            setLoadingData(false);
        }
    }

    // Available terms for chosen SY
    const availableTerms = useMemo(() => {
        if (!selectedSYId) return terms;
        return terms.filter((t) => String(t.school_year_id) === String(selectedSYId));
    }, [terms, selectedSYId]);

    // Keep selectedTermId in sync when School Year changes
    useEffect(() => {
        if (availableTerms.length > 0 && !availableTerms.some((t) => String(t.id) === String(selectedTermId))) {
            const activeTerm = availableTerms.find((t) => t.status === 'active') || availableTerms[0];
            setSelectedTermId(String(activeTerm.id));
        }
    }, [availableTerms, selectedTermId]);

    // Available sections for chosen Grade & SY
    const availableSections = useMemo(() => {
        return sections.filter((s) => {
            const matchSY = !selectedSYId || String(s.school_year_id) === String(selectedSYId);
            const matchGrade = !selectedGradeId || String(s.grade_level_id) === String(selectedGradeId);
            return matchSY && matchGrade;
        });
    }, [sections, selectedSYId, selectedGradeId]);

    // Reset selectedSectionId if selectedGradeId changes to another grade
    useEffect(() => {
        if (selectedSectionId && selectedGradeId) {
            const sec = sections.find((s) => String(s.id) === String(selectedSectionId));
            if (sec && String(sec.grade_level_id) !== String(selectedGradeId)) {
                setSelectedSectionId('');
            }
        }
    }, [selectedGradeId, selectedSectionId, sections]);

    // Available subject names
    const availableSubjectNames = useMemo(() => {
        return Array.from(new Set(subjects.map((s) => s.name).filter(Boolean))).sort();
    }, [subjects]);

    // Drill-down filtering (section or subject)
    const filteredRecords = useMemo(() => {
        return (consolidationData?.records || []).filter((record) => {
            if (selectedSectionId && String(record.section_id) !== String(selectedSectionId)) return false;
            if (selectedSubjectName && record.subject?.name !== selectedSubjectName) return false;
            return true;
        });
    }, [consolidationData, selectedSectionId, selectedSubjectName]);

    // Compute Mastery Distribution
    const getMasteryDistribution = (rawScores, totalItems = 50) => {
        const counts = { mastered: 0, closelyApproximating: 0, movingTowards: 0, average: 0, low: 0, veryLow: 0, noMastery: 0 };
        if (!Array.isArray(rawScores) || totalItems <= 0) return counts;
        rawScores.forEach((score) => {
            if (score === null || score === undefined || isNaN(Number(score))) return;
            const pct = (Number(score) / Number(totalItems)) * 100;
            if (pct >= 96) counts.mastered++;
            else if (pct >= 86) counts.closelyApproximating++;
            else if (pct >= 66) counts.movingTowards++;
            else if (pct >= 35) counts.average++;
            else if (pct >= 15) counts.low++;
            else if (pct >= 5) counts.veryLow++;
            else counts.noMastery++;
        });
        return counts;
    };

    // Cohort Statistical Summary
    const summary = useMemo(() => {
        const recordCount = filteredRecords.length;
        if (recordCount === 0) {
            return {
                recordCount: 0,
                totalExaminees: 0,
                overallMean: 0,
                overallMps: 0,
                overallSd: 0,
                highestScore: 0,
                lowestScore: 0,
                totalsMastery: { mastered: 0, closelyApproximating: 0, movingTowards: 0, average: 0, low: 0, veryLow: 0, noMastery: 0 },
                passingCount: 0,
                topCompetencies: [],
            };
        }

        let totalExaminees = 0;
        let sumMean = 0;
        let sumMps = 0;
        let sumSd = 0;
        let highestScore = -Infinity;
        let lowestScore = Infinity;
        let hasLowestScore = false;
        let passingCount = 0;

        const totalsMastery = { mastered: 0, closelyApproximating: 0, movingTowards: 0, average: 0, low: 0, veryLow: 0, noMastery: 0 };

        for (const record of filteredRecords) {
            totalExaminees += Number(record.no_of_entries || 0);
            sumMean += Number(record.mean || 0);
            const mpsVal = Number(record.mps || 0);
            sumMps += mpsVal;
            sumSd += Number(record.sd || 0);

            if (record.highest_score !== null && record.highest_score !== undefined) {
                const high = Number(record.highest_score);
                if (high > highestScore) highestScore = high;
            }
            if (record.lowest_score !== null && record.lowest_score !== undefined) {
                const low = Number(record.lowest_score);
                if (low < lowestScore) lowestScore = low;
                hasLowestScore = true;
            }
            if (mpsVal >= 75) passingCount++;

            const dist = getMasteryDistribution(record.raw_scores, record.total_items || 50);
            totalsMastery.mastered += dist.mastered;
            totalsMastery.closelyApproximating += dist.closelyApproximating;
            totalsMastery.movingTowards += dist.movingTowards;
            totalsMastery.average += dist.average;
            totalsMastery.low += dist.low;
            totalsMastery.veryLow += dist.veryLow;
            totalsMastery.noMastery += dist.noMastery;
        }

        return {
            recordCount,
            totalExaminees,
            overallMean: sumMean / recordCount,
            overallMps: sumMps / recordCount,
            overallSd: sumSd / recordCount,
            highestScore: highestScore === -Infinity ? 0 : highestScore,
            lowestScore: !hasLowestScore || lowestScore === Infinity ? 0 : lowestScore,
            totalsMastery,
            passingCount,
        };
    }, [filteredRecords]);

    // Active Display Names & Scoping
    const isSchoolWide = !selectedGradeId;
    const currentGradeObj = gradeLevels.find((g) => String(g.id) === String(selectedGradeId));
    const currentGradeLabel = currentGradeObj ? currentGradeObj.name : 'School-wide (All Grades)';

    const activeSYName = schoolYears.find((s) => String(s.id) === String(selectedSYId))?.name || 'School Year';
    const activeTermName = availableTerms.find((t) => String(t.id) === String(selectedTermId))?.name || 'Term';

    const activeSectionObj = availableSections.find((s) => String(s.id) === String(selectedSectionId));
    const activeSectionGradeName = activeSectionObj?.grade_level?.name || (gradeLevels.find((g) => String(g.id) === String(activeSectionObj?.grade_level_id))?.name);
    const activeSectionName = activeSectionObj
        ? (isSchoolWide && activeSectionGradeName ? `${activeSectionGradeName} - ${activeSectionObj.name}` : activeSectionObj.name)
        : 'All';
    const activeSubjectName = selectedSubjectName || 'All';

    const schoolYearOptions = schoolYears.map((sy) => ({ value: String(sy.id), label: sy.name }));
    const termOptions = availableTerms.map((t) => ({ value: String(t.id), label: t.name }));
    const sectionOptions = useMemo(() => {
        return [
            { value: '', label: 'All Sections' },
            ...availableSections.map((s) => {
                const gradeName = s.grade_level?.name || gradeLevels.find((g) => String(g.id) === String(s.grade_level_id))?.name;
                const label = isSchoolWide && gradeName ? `${gradeName} - ${s.name}` : s.name;
                return { value: String(s.id), label };
            }),
        ];
    }, [availableSections, isSchoolWide, gradeLevels]);
    const subjectOptions = [{ value: '', label: 'All Subjects' }, ...availableSubjectNames.map((n) => ({ value: n, label: n }))];

    return (
        <div className="flex w-full flex-col gap-5">
            {/* Header: Title & Assessment Type Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
                <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-900">
                        Consolidated Performance Reports
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Multi-section DepEd statistical aggregation, MPS benchmarks, and summary analysis.
                    </p>
                </div>

                {/* Assessment Type Switcher */}
                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
                    <button
                        type="button"
                        onClick={() => setAssessmentType('term_exam')}
                        className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                            assessmentType === 'term_exam'
                                ? 'bg-white text-[#0071e3] shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Term Exam
                    </button>
                    <button
                        type="button"
                        onClick={() => setAssessmentType('diagnostic')}
                        className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                            assessmentType === 'diagnostic'
                                ? 'bg-white text-[#0071e3] shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Diagnostic Test
                    </button>
                </div>
            </div>

            {/* Filter Toolbar: SY, Term, Section, Subject */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs">
                <div className="flex flex-wrap items-center gap-2">
                    <FilterPill
                        icon={
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        }
                        label="SY"
                        value={selectedSYId}
                        displayValue={activeSYName}
                        options={schoolYearOptions}
                        onChange={setSelectedSYId}
                        disabled={refLoading}
                    />

                    <FilterPill
                        icon={
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        }
                        label="Term"
                        value={selectedTermId}
                        displayValue={activeTermName}
                        options={termOptions}
                        onChange={setSelectedTermId}
                        disabled={refLoading}
                    />

                    <FilterPill
                        icon={
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                            </svg>
                        }
                        label="Section"
                        value={selectedSectionId}
                        displayValue={selectedSectionId ? activeSectionName : 'All'}
                        options={sectionOptions}
                        onChange={setSelectedSectionId}
                        onClear={() => setSelectedSectionId('')}
                    />

                    <FilterPill
                        icon={
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                            </svg>
                        }
                        label="Subject"
                        value={selectedSubjectName}
                        displayValue={selectedSubjectName ? activeSubjectName : 'All'}
                        options={subjectOptions}
                        onChange={setSelectedSubjectName}
                        onClear={() => setSelectedSubjectName('')}
                    />

                    {(selectedSectionId || selectedSubjectName) && (
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedSectionId('');
                                setSelectedSubjectName('');
                            }}
                            className="inline-flex h-9 items-center gap-1 rounded-xl px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                        >
                            ✕ Reset filters
                        </button>
                    )}
                </div>

                {/* Scope Indicator */}
                <div className="text-xs font-semibold text-slate-500">
                    Showing: <span className="text-[#0071e3] font-bold">{currentGradeLabel}</span>
                </div>
            </div>

            {/* Grade Switcher Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                    type="button"
                    onClick={() => setSelectedGradeId('')}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-2xs shrink-0 ${
                        !selectedGradeId
                            ? 'bg-[#0071e3] text-white'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/90'
                    }`}
                >
                    School-Wide (All Grades)
                </button>
                {gradeLevels.map((grade) => (
                    <button
                        key={grade.id}
                        type="button"
                        onClick={() => setSelectedGradeId(String(grade.id))}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-2xs shrink-0 ${
                            String(selectedGradeId) === String(grade.id)
                                ? 'bg-[#0071e3] text-white'
                                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/90'
                        }`}
                    >
                        {grade.name}
                    </button>
                ))}
            </div>

            {/* Error Message */}
            {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
                    {errorMessage}
                </div>
            )}

            {/* Cohort KPI Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <MetricCard
                    title="Sections"
                    value={summary.recordCount}
                    subtitle="Encoded classes"
                />
                <MetricCard
                    title="Examinees"
                    value={summary.totalExaminees}
                    subtitle="Students tested"
                />
                <MetricCard
                    title="Mean (X̄)"
                    value={summary.recordCount === 0 ? '—' : summary.overallMean.toFixed(2)}
                    subtitle={summary.recordCount === 0 ? 'No records' : 'Average raw score'}
                />
                <MetricCard
                    title="DepEd MPS"
                    value={summary.recordCount === 0 ? '—' : `${summary.overallMps.toFixed(2)}%`}
                    subtitle={summary.recordCount === 0 ? 'No records encoded' : summary.overallMps >= 75 ? 'Passing standard met' : 'Below 75% target'}
                    badge={summary.recordCount === 0 ? 'No Data' : summary.overallMps >= 75 ? 'Passed' : 'At Risk'}
                    badgeColor={summary.recordCount === 0 ? 'bg-slate-100 text-slate-500 border-slate-200' : summary.overallMps >= 75 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}
                />
                <MetricCard
                    title="Std. Deviation"
                    value={summary.recordCount === 0 ? '—' : summary.overallSd.toFixed(2)}
                    subtitle={summary.recordCount === 0 ? 'No records' : 'Overall dispersion'}
                />
                <MetricCard
                    title="Passing Sections"
                    value={summary.recordCount === 0 ? '0 / 0' : `${summary.passingCount} / ${summary.recordCount}`}
                    subtitle="MPS ≥ 75.00%"
                />
            </div>

            {/* Official DepEd Forest Green Consolidation Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                        <thead>
                            <tr className="bg-[#1e5622] text-white font-bold uppercase tracking-wider text-[11px]">
                                <th rowSpan="2" className="border border-green-800 px-3 py-3 whitespace-nowrap">
                                    {isSchoolWide ? 'Grade & Section' : 'Section'}
                                </th>
                                <th rowSpan="2" className="border border-green-800 px-3 py-3 whitespace-nowrap">Subject</th>
                                <th rowSpan="2" className="border border-green-800 px-3 py-3 whitespace-nowrap">Teacher</th>
                                <th rowSpan="2" className="border border-green-800 px-2.5 py-3 text-center whitespace-nowrap">Examinees</th>
                                <th rowSpan="2" className="border border-green-800 px-2.5 py-3 text-center whitespace-nowrap">Highest</th>
                                <th rowSpan="2" className="border border-green-800 px-2.5 py-3 text-center whitespace-nowrap">Lowest</th>
                                <th rowSpan="2" className="border border-green-800 px-2.5 py-3 text-center whitespace-nowrap">Mean (X̄)</th>
                                <th rowSpan="2" className="border border-green-800 px-2.5 py-3 text-center whitespace-nowrap">SD</th>
                                <th rowSpan="2" className="border border-green-800 px-3 py-3 text-center whitespace-nowrap bg-[#17441a]">DepEd MPS</th>
                                <th colSpan="7" className="border border-green-800 px-2 py-2 text-center bg-[#133816] tracking-normal font-semibold">
                                    Mastery Level Distribution (No. of Examinees)
                                </th>
                                <th rowSpan="2" className="border border-green-800 px-3 py-3 min-w-[180px]">Least Learned Competency</th>
                                <th rowSpan="2" className="border border-green-800 px-3 py-3 text-center bg-[#256a29] whitespace-nowrap">Remarks</th>
                            </tr>
                            <tr className="bg-[#246528] text-white text-[10px] font-semibold">
                                <th className="border border-green-800 px-2 py-1.5 text-center">Mastered<br/><span className="font-mono opacity-80">96-100%</span></th>
                                <th className="border border-green-800 px-2 py-1.5 text-center">Closely Approx.<br/><span className="font-mono opacity-80">86-95%</span></th>
                                <th className="border border-green-800 px-2 py-1.5 text-center">Moving Towards<br/><span className="font-mono opacity-80">66-85%</span></th>
                                <th className="border border-green-800 px-2 py-1.5 text-center">Average<br/><span className="font-mono opacity-80">35-65%</span></th>
                                <th className="border border-green-800 px-2 py-1.5 text-center">Low<br/><span className="font-mono opacity-80">15-34%</span></th>
                                <th className="border border-green-800 px-2 py-1.5 text-center">Very Low<br/><span className="font-mono opacity-80">5-14%</span></th>
                                <th className="border border-green-800 px-2 py-1.5 text-center">No Mastery<br/><span className="font-mono opacity-80">0-4%</span></th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {loadingData ? (
                                <tr>
                                    <td colSpan="18" className="px-4 py-16 text-center text-slate-500 font-medium">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="size-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                                            <span>Loading consolidated records…</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="18" className="px-4 py-16 text-center text-slate-500 font-medium">
                                        No assessment records match the selected school year, term, and grade level scope.
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((record) => {
                                    const mps = Number(record.mps || 0);
                                    const dist = getMasteryDistribution(record.raw_scores, record.total_items || 50);

                                    return (
                                        <tr key={record.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-emerald-50/30 transition">
                                            <td className="whitespace-nowrap border-r border-slate-200/80 px-3 py-2.5 font-bold text-slate-900">
                                                {isSchoolWide
                                                    ? `${record.grade_level?.name || 'Grade'} - ${record.section?.name || 'Section'}`
                                                    : (record.section?.name || 'Section')}
                                            </td>
                                            <td className="border-r border-slate-200/80 px-3 py-2.5 text-slate-700 font-medium whitespace-nowrap">
                                                {record.subject?.name || 'Unassigned'}
                                            </td>
                                            <td className="border-r border-slate-200/80 px-3 py-2.5 text-slate-600 whitespace-nowrap">
                                                {record.teacher?.name || 'Unassigned'}
                                            </td>
                                            <td className="border-r border-slate-200/80 px-2.5 py-2.5 text-center font-bold text-slate-900">
                                                {record.no_of_entries}
                                            </td>
                                            <td className="border-r border-slate-200/80 px-2.5 py-2.5 text-center text-slate-700">
                                                {record.highest_score !== null && record.highest_score !== undefined ? Number(record.highest_score).toFixed(2) : '—'}
                                            </td>
                                            <td className="border-r border-slate-200/80 px-2.5 py-2.5 text-center text-slate-700">
                                                {record.lowest_score !== null && record.lowest_score !== undefined ? Number(record.lowest_score).toFixed(2) : '—'}
                                            </td>
                                            <td className="border-r border-slate-200/80 px-2.5 py-2.5 text-center font-semibold text-slate-800">
                                                {Number(record.mean || 0).toFixed(2)}
                                            </td>
                                            <td className="border-r border-slate-200/80 px-2.5 py-2.5 text-center text-slate-700">
                                                {Number(record.sd || 0).toFixed(2)}
                                            </td>
                                            <td className={`border-r border-slate-200/80 px-3 py-2.5 text-center font-bold ${
                                                mps >= 75 ? 'text-emerald-700 bg-emerald-50/50' : 'text-amber-700 bg-amber-50/50'
                                            }`}>
                                                {mps.toFixed(2)}%
                                            </td>

                                            {/* 7 Mastery Columns */}
                                            <td className="border-r border-slate-200/80 px-2 py-2.5 text-center font-bold text-emerald-800 bg-emerald-50/20">{dist.mastered}</td>
                                            <td className="border-r border-slate-200/80 px-2 py-2.5 text-center font-bold text-emerald-800 bg-emerald-50/20">{dist.closelyApproximating}</td>
                                            <td className="border-r border-slate-200/80 px-2 py-2.5 text-center font-bold text-sky-800 bg-sky-50/20">{dist.movingTowards}</td>
                                            <td className="border-r border-slate-200/80 px-2 py-2.5 text-center font-bold text-amber-800 bg-amber-50/20">{dist.average}</td>
                                            <td className="border-r border-slate-200/80 px-2 py-2.5 text-center font-bold text-orange-800 bg-orange-50/20">{dist.low}</td>
                                            <td className="border-r border-slate-200/80 px-2 py-2.5 text-center font-bold text-red-800 bg-red-50/20">{dist.veryLow}</td>
                                            <td className="border-r border-slate-200/80 px-2 py-2.5 text-center font-bold text-slate-700 bg-slate-50/50">{dist.noMastery}</td>

                                            <td className="border-r border-slate-200/80 px-3 py-2.5 text-slate-800">
                                                {record.least_learned_competency || <span className="text-slate-400 italic">None specified</span>}
                                            </td>
                                            <td className="border-r border-slate-200/80 px-3 py-2.5 text-center whitespace-nowrap">
                                                <span className="rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                                                    {record.remarks || 'Complete'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>

                        {filteredRecords.length > 0 && (
                            <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                                <tr>
                                    <td colSpan="3" className="border border-slate-300 px-3 py-3 text-right uppercase text-[11px] tracking-wider text-slate-700">
                                        Consolidated Overall Average:
                                    </td>
                                    <td className="border border-slate-300 px-2.5 py-3 text-center text-blue-900 font-bold">{summary.totalExaminees}</td>
                                    <td className="border border-slate-300 px-2.5 py-3 text-center text-slate-800">{summary.highestScore.toFixed(2)}</td>
                                    <td className="border border-slate-300 px-2.5 py-3 text-center text-slate-800">{summary.lowestScore.toFixed(2)}</td>
                                    <td className="border border-slate-300 px-2.5 py-3 text-center text-blue-900 font-bold">{summary.overallMean.toFixed(2)}</td>
                                    <td className="border border-slate-300 px-2.5 py-3 text-center text-slate-800">{summary.overallSd.toFixed(2)}</td>
                                    <td className={`border border-slate-300 px-3 py-3 text-center font-extrabold ${
                                        summary.overallMps >= 75 ? 'text-emerald-700 bg-emerald-100/60' : 'text-amber-700 bg-amber-100/60'
                                    }`}>
                                        {summary.overallMps.toFixed(2)}%
                                    </td>

                                    <td className="border border-slate-300 px-2 py-3 text-center text-emerald-800 bg-emerald-100/50">{summary.totalsMastery.mastered}</td>
                                    <td className="border border-slate-300 px-2 py-3 text-center text-emerald-800 bg-emerald-100/50">{summary.totalsMastery.closelyApproximating}</td>
                                    <td className="border border-slate-300 px-2 py-3 text-center text-sky-800 bg-sky-100/50">{summary.totalsMastery.movingTowards}</td>
                                    <td className="border border-slate-300 px-2 py-3 text-center text-amber-800 bg-amber-100/50">{summary.totalsMastery.average}</td>
                                    <td className="border border-slate-300 px-2 py-3 text-center text-orange-800 bg-orange-100/50">{summary.totalsMastery.low}</td>
                                    <td className="border border-slate-300 px-2 py-3 text-center text-red-800 bg-red-100/50">{summary.totalsMastery.veryLow}</td>
                                    <td className="border border-slate-300 px-2 py-3 text-center text-slate-800 bg-slate-200/50">{summary.totalsMastery.noMastery}</td>

                                    <td className="border border-slate-300 px-3 py-3 text-slate-500 font-medium">—</td>
                                    <td className="border border-slate-300 px-3 py-3 text-center text-emerald-800 font-bold bg-emerald-100 whitespace-nowrap">
                                        Verified
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}
