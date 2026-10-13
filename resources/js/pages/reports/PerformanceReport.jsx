import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../api';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';

/**
 * Filter Pill Component (Apple HIG Clean Dropdown)
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
            <span className={`pointer-events-none truncate max-w-[160px] ${isFiltered ? 'font-semibold text-slate-900' : 'text-slate-800'}`}>
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
    const [showFilters, setShowFilters] = useState(false);

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
            const activeSY = refs.active_sy || syList.find((s) => Boolean(s.is_active)) || syList[0];
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

    // Reset drill-down section & subject filter when grade changes
    useEffect(() => {
        setSelectedSectionId('');
        setSelectedSubjectName('');
    }, [selectedGradeId]);

    // Available subject names
    const availableSubjectNames = useMemo(() => {
        const gradeFiltered = subjects.filter((subject) => (
            !selectedGradeId || String(subject.grade_level_id) === String(selectedGradeId)
        ));
        return Array.from(new Set(gradeFiltered.map((s) => s.name).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    }, [subjects, selectedGradeId]);

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
        let scoresArr = rawScores;
        if (typeof rawScores === 'string') {
            try {
                scoresArr = JSON.parse(rawScores);
            } catch (e) {
                scoresArr = [];
            }
        }
        if (!Array.isArray(scoresArr) || totalItems <= 0) return counts;
        scoresArr.forEach((score) => {
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

    /**
     * Compute aggregated table stats for a group of records.
     * Uses exact pooled population statistics so that standard deviation, mean,
     * and MPS correctly account for both within-group and between-group variances.
     */
    const computeStats = (recList) => {
        if (!recList || recList.length === 0) {
            return {
                recordCount: 0,
                totalExaminees: 0,
                highestScore: 0,
                lowestScore: 0,
                mean: 0,
                sd: 0,
                mps: 0,
                mastery: {
                    mastered: 0,
                    closelyApproximating: 0,
                    movingTowards: 0,
                    average: 0,
                    low: 0,
                    veryLow: 0,
                    noMastery: 0,
                    total: 0,
                },
                leastLearned: '—',
            };
        }

        // Single record: return exact values directly
        if (recList.length === 1) {
            const r = recList[0];
            const dist = r.mastery || getMasteryDistribution(r.raw_scores, r.total_items || 50);
            const mTotal =
                (dist.mastered || 0) +
                (dist.closelyApproximating || 0) +
                (dist.movingTowards || 0) +
                (dist.average || 0) +
                (dist.low || 0) +
                (dist.veryLow || 0) +
                (dist.noMastery || 0);

            return {
                recordCount: 1,
                totalExaminees: Number(r.no_of_entries || 0),
                highestScore: r.highest_score !== null && r.highest_score !== undefined ? Number(r.highest_score) : 0,
                lowestScore: r.lowest_score !== null && r.lowest_score !== undefined ? Number(r.lowest_score) : 0,
                mean: Number(r.mean || 0),
                sd: Number(r.sd || 0),
                mps: Number(r.mps || 0),
                mastery: { ...dist, total: mTotal },
                leastLearned: r.least_learned_competency?.trim() || '—',
            };
        }

        // Multiple records to consolidate:
        // Collect raw scores if available
        const allRawScores = recList.flatMap((r) => {
            let raw = r.raw_scores;
            if (typeof raw === 'string') {
                try {
                    raw = JSON.parse(raw);
                } catch (e) {
                    raw = [];
                }
            }
            return Array.isArray(raw) ? raw : [];
        }).map(Number).filter((v) => !isNaN(v));

        let totalExaminees = 0;
        let highestScore = -Infinity;
        let lowestScore = Infinity;
        let hasLowestScore = false;
        const compMap = {};

        const totalsMastery = {
            mastered: 0,
            closelyApproximating: 0,
            movingTowards: 0,
            average: 0,
            low: 0,
            veryLow: 0,
            noMastery: 0,
            total: 0,
        };

        for (const r of recList) {
            const n = Number(r.no_of_entries || 0);
            totalExaminees += n;

            if (r.highest_score !== null && r.highest_score !== undefined) {
                const high = Number(r.highest_score);
                if (high > highestScore) highestScore = high;
            }

            if (r.lowest_score !== null && r.lowest_score !== undefined) {
                const low = Number(r.lowest_score);
                if (low < lowestScore) lowestScore = low;
                hasLowestScore = true;
            }

            const comp = r.least_learned_competency?.trim();
            if (comp && comp !== '—' && comp !== '-') {
                compMap[comp] = (compMap[comp] || 0) + (n > 0 ? n : 1);
            }

            const dist = r.mastery || getMasteryDistribution(r.raw_scores, r.total_items || 50);
            totalsMastery.mastered += (dist.mastered || 0);
            totalsMastery.closelyApproximating += (dist.closelyApproximating || 0);
            totalsMastery.movingTowards += (dist.movingTowards || 0);
            totalsMastery.average += (dist.average || 0);
            totalsMastery.low += (dist.low || 0);
            totalsMastery.veryLow += (dist.veryLow || 0);
            totalsMastery.noMastery += (dist.noMastery || 0);
        }

        totalsMastery.total =
            totalsMastery.mastered +
            totalsMastery.closelyApproximating +
            totalsMastery.movingTowards +
            totalsMastery.average +
            totalsMastery.low +
            totalsMastery.veryLow +
            totalsMastery.noMastery;

        const sampleTotalItems = recList[0]?.total_items || 50;

        let computedMean = 0;
        let computedSd = 0;

        // If raw scores match total examinees, compute exact population mean and SD
        if (allRawScores.length > 0 && allRawScores.length === totalExaminees) {
            const sumScores = allRawScores.reduce((acc, v) => acc + v, 0);
            computedMean = sumScores / totalExaminees;
            const variance = allRawScores.reduce((acc, v) => acc + Math.pow(v - computedMean, 2), 0) / totalExaminees;
            computedSd = Math.sqrt(variance);
        } else {
            // Otherwise, calculate exact pooled mean and pooled variance
            // Pooled Mean: (sum n_i * mean_i) / sum(n_i)
            let sumWeightedMean = 0;
            for (const r of recList) {
                const n = Number(r.no_of_entries || 0);
                const meanVal = Number(r.mean || 0);
                sumWeightedMean += meanVal * (n > 0 ? n : 1);
            }
            computedMean = totalExaminees > 0 ? sumWeightedMean / totalExaminees : 0;

            // Pooled Population Variance: sum(n_i * (sd_i^2 + (mean_i - mean_pooled)^2)) / sum(n_i)
            let sumVarianceComponents = 0;
            for (const r of recList) {
                const n = Number(r.no_of_entries || 0);
                const meanVal = Number(r.mean || 0);
                const sdVal = Number(r.sd || 0);
                const weight = n > 0 ? n : 1;
                const variance_i = Math.pow(sdVal, 2);
                const betweenGroup_i = Math.pow(meanVal - computedMean, 2);
                sumVarianceComponents += weight * (variance_i + betweenGroup_i);
            }
            const pooledVariance = totalExaminees > 0 ? sumVarianceComponents / totalExaminees : 0;
            computedSd = Math.sqrt(pooledVariance);
        }

        const computedMps = sampleTotalItems > 0 ? (computedMean / sampleTotalItems) * 100 : 0;

        const topComp = Object.entries(compMap)
            .sort((a, b) => b[1] - a[1])
            .map((e) => e[0])
            .slice(0, 2)
            .join('; ') || '—';

        return {
            recordCount: recList.length,
            totalExaminees,
            highestScore: highestScore === -Infinity ? 0 : highestScore,
            lowestScore: !hasLowestScore || lowestScore === Infinity ? 0 : lowestScore,
            mean: computedMean,
            sd: computedSd,
            mps: computedMps,
            mastery: totalsMastery,
            leastLearned: topComp,
        };
    };

    /**
     * MULTI-TABLE GROUP GENERATOR:
     * - School-Wide (All Subjects): 4 Grade-level tables (Grade 7, Grade 8, Grade 9, Grade 10) with subject rows.
     * - School-Wide (Filtered Subject): 1 Unified table (e.g. FILIPINO — ALL GRADE LEVELS) with grade rows.
     * - Specific Grade (All Subjects): Grouped by Section (all sections in grade) with all subject rows.
     * - Specific Grade (Filtered Subject): 1 Section comparison table (e.g. GRADE 7 — FILIPINO) with all section rows.
     */
    const reportTableGroups = useMemo(() => {
        const records = filteredRecords;
        if (records.length === 0) return [];

        const sortedGrades = [...gradeLevels].sort((a, b) => (Number(a.level) || 0) - (Number(b.level) || 0));

        // Canonical DepEd Subject Order helper
        const depedSubjectOrder = [
            'Filipino',
            'English',
            'Mathematics',
            'Science',
            'Araling Panlipunan',
            'Technology and Livelihood Education',
            'TLE',
            'Music, Arts, Physical Education and Health',
            'MAPEH',
            'Edukasyon sa Pagpapakatao',
            'Values Education',
            'EsP',
        ];

        const getSubjectOrderIndex = (subjName) => {
            const idx = depedSubjectOrder.findIndex(
                (s) => s.toLowerCase() === (subjName || '').toLowerCase()
            );
            return idx === -1 ? 999 : idx;
        };

        const sortSubjectNames = (names) => {
            return [...names].sort((a, b) => {
                const idxA = getSubjectOrderIndex(a);
                const idxB = getSubjectOrderIndex(b);
                if (idxA !== idxB) return idxA - idxB;
                return (a || '').localeCompare(b || '');
            });
        };

        // Helper to build a consolidated subject record for a given grade
        const buildConsolidatedSubjectRecord = (grade, subjectName, matchingRecords) => {
            const stats = computeStats(matchingRecords);

            return {
                id: `consolidated-${grade.id}-${subjectName}`,
                grade_level_id: grade.id,
                grade_level: grade,
                subject_id: matchingRecords[0]?.subject_id,
                subject: { name: subjectName },
                displayName: subjectName,
                isConsolidated: true,
                no_of_entries: stats.totalExaminees,
                highest_score: stats.highestScore,
                lowest_score: stats.lowestScore,
                mean: stats.mean,
                sd: stats.sd,
                mps: stats.mps,
                mastery: stats.mastery,
                raw_scores: matchingRecords.flatMap((r) => {
                    if (Array.isArray(r.raw_scores)) return r.raw_scores;
                    if (typeof r.raw_scores === 'string') {
                        try { return JSON.parse(r.raw_scores); } catch (e) { return []; }
                    }
                    return [];
                }),
                total_items: matchingRecords[0]?.total_items || 50,
                least_learned_competency: stats.leastLearned,
                remarks: stats.mps >= 75 ? 'Met Target' : 'Intervention Needed',
            };
        };

        // =========================================================================
        // MODE 1 & 2: SCHOOL-WIDE (All Grades)
        // =========================================================================
        if (!selectedGradeId) {
            // Case 1A: Specific Subject Filtered (e.g., Filipino across all grades)
            // One unified table comparing all grade levels for this subject!
            if (selectedSubjectName) {
                const gradeRows = [];
                sortedGrades.forEach((grade) => {
                    const gradeName = grade.display_name || grade.name || `Grade ${grade.level}`;
                    const matchingRecords = records.filter((r) => {
                        const matchesSubject = r.subject?.name === selectedSubjectName;
                        const matchesGrade = String(r.grade_level_id) === String(grade.id) || Number(r.grade_level?.level) === Number(grade.level);
                        return matchesSubject && matchesGrade;
                    });

                    if (matchingRecords.length > 0) {
                        const rec = buildConsolidatedSubjectRecord(grade, selectedSubjectName, matchingRecords);
                        rec.displayName = gradeName; // Row title is the Grade Level
                        gradeRows.push(rec);
                    }
                });

                if (gradeRows.length > 0) {
                    return [{
                        id: `schoolwide-subject-${selectedSubjectName}`,
                        title: `${selectedSubjectName.toUpperCase()} — ALL GRADE LEVELS`,
                        rowHeaderLabel: 'Grade Level',
                        records: gradeRows,
                        summary: computeStats(records),
                    }];
                }
                return [];
            }

            // Case 1B: All Subjects across School-Wide
            // 4 Grade tables (GRADE 7, GRADE 8, GRADE 9, GRADE 10), each containing 8 subject rows!
            const distinctSubjects = sortSubjectNames(
                Array.from(new Set(records.map((r) => r.subject?.name).filter(Boolean)))
            );

            const groups = [];
            sortedGrades.forEach((grade) => {
                const gradeName = grade.display_name || grade.name || `Grade ${grade.level}`;
                const subjectRows = [];

                distinctSubjects.forEach((subjectName) => {
                    const matchingRecords = records.filter((r) => {
                        const matchesSubject = r.subject?.name === subjectName;
                        const matchesGrade = String(r.grade_level_id) === String(grade.id) || Number(r.grade_level?.level) === Number(grade.level);
                        return matchesSubject && matchesGrade;
                    });

                    if (matchingRecords.length > 0) {
                        const rec = buildConsolidatedSubjectRecord(grade, subjectName, matchingRecords);
                        rec.displayName = subjectName; // Row title is the Subject
                        subjectRows.push(rec);
                    }
                });

                if (subjectRows.length > 0) {
                    groups.push({
                        id: `schoolwide-grade-${grade.id}`,
                        title: gradeName.toUpperCase(),
                        rowHeaderLabel: 'Subject',
                        records: subjectRows,
                        summary: computeStats(subjectRows),
                    });
                }
            });

            return groups;
        }

        // =========================================================================
        // MODE 3 & 4: SPECIFIC GRADE LEVEL
        // =========================================================================
        const currentGrade = gradeLevels.find((g) => String(g.id) === String(selectedGradeId));
        const gradeLabel = currentGrade?.display_name || currentGrade?.name || 'Selected Grade';

        // Case 2A: Specific Subject Filtered (e.g., Grade 7 Filipino)
        // One comparison table comparing all sections for this subject
        if (selectedSubjectName) {
            const sortedRecords = [...records].sort((a, b) => {
                const secA = a.section?.name || '';
                const secB = b.section?.name || '';
                return secA.localeCompare(secB, undefined, { numeric: true });
            });

            return [{
                id: `grade-subject-${selectedGradeId}-${selectedSubjectName}`,
                title: `${gradeLabel.toUpperCase()} — ${selectedSubjectName.toUpperCase()}`,
                rowHeaderLabel: 'Section',
                records: sortedRecords,
                summary: computeStats(sortedRecords),
            }];
        }

        // Case 2B: All Subjects for Specific Grade -> Grouped by Section
        const distinctSectionIds = Array.from(new Set(records.map((r) => String(r.section_id)).filter(Boolean)));
        const sectionList = distinctSectionIds.map((secId) => {
            const secRecord = records.find((r) => String(r.section_id) === secId);
            return {
                id: secId,
                name: secRecord?.section?.name || 'Section',
            };
        }).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

        const groups = [];
        sectionList.forEach((section) => {
            const matchingRecords = records.filter((r) => String(r.section_id) === String(section.id));
            if (matchingRecords.length > 0) {
                const sortedMatchingRecords = [...matchingRecords].sort((a, b) => {
                    const idxA = getSubjectOrderIndex(a.subject?.name);
                    const idxB = getSubjectOrderIndex(b.subject?.name);
                    if (idxA !== idxB) return idxA - idxB;
                    return (a.subject?.name || '').localeCompare(b.subject?.name || '');
                });

                groups.push({
                    id: `sec-${section.id}`,
                    title: `${gradeLabel.toUpperCase()} — SECTION ${section.name.toUpperCase()}`,
                    rowHeaderLabel: 'Subject',
                    records: sortedMatchingRecords,
                    summary: computeStats(sortedMatchingRecords),
                });
            }
        });

        return groups;
    }, [filteredRecords, selectedGradeId, selectedSubjectName, gradeLevels]);

    // Cohort Statistical Summary (KPI Panels)
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
                strugglingCount: 0,
                mastery: {
                    mastered: 0,
                    closelyApproximating: 0,
                    movingTowards: 0,
                    average: 0,
                    low: 0,
                    veryLow: 0,
                    noMastery: 0,
                    total: 0,
                },
            };
        }

        const stats = computeStats(filteredRecords);
        const strugglingCount = filteredRecords.filter((r) => Number(r.mps || 0) < 75).length;

        return {
            recordCount,
            totalExaminees: stats.totalExaminees,
            overallMean: stats.mean,
            overallMps: stats.mps,
            overallSd: stats.sd,
            highestScore: stats.highestScore,
            lowestScore: stats.lowestScore,
            strugglingCount,
            mastery: stats.mastery,
        };
    }, [filteredRecords]);

    // Active Display Names & Scoping
    const isSchoolWide = !selectedGradeId;
    const currentGradeObj = gradeLevels.find((g) => String(g.id) === String(selectedGradeId));
    const currentGradeLabel = currentGradeObj ? (currentGradeObj.display_name || currentGradeObj.name) : 'School-wide (All Grades)';

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
    const gradeOptions = useMemo(() => {
        return [
            { value: '', label: 'School-Wide (All Grades)' },
            ...gradeLevels.map((g) => ({
                value: String(g.id),
                label: g.display_name || g.name || `Grade ${g.level}`,
            })),
        ];
    }, [gradeLevels]);
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

    const hasActiveFilters = Boolean(selectedGradeId || selectedSectionId || selectedSubjectName);

    // Dynamic Title Generation based on active filters
    const autoReportTitle = useMemo(() => {
        const typeLabel = assessmentType === 'diagnostic' ? 'Diagnostic Assessment' : 'Quarterly Assessment';
        if (selectedSubjectName && selectedGradeId) {
            return `${currentGradeLabel} — ${selectedSubjectName} ${typeLabel} Consolidated Report`;
        }
        if (selectedSubjectName && !selectedGradeId) {
            return `School-Wide — ${selectedSubjectName} ${typeLabel} Consolidated Report`;
        }
        if (selectedGradeId) {
            return `${currentGradeLabel} ${typeLabel} Consolidated Report`;
        }
        return `School-Wide ${typeLabel} Consolidated Report`;
    }, [assessmentType, selectedSubjectName, selectedGradeId, currentGradeLabel]);

    return (
        <div className="flex w-full flex-col gap-5">
            {/* Minimal Header Card: Auto-generated Title & Funnel Filter Toggle */}
            <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
                <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">
                            {autoReportTitle}
                        </h2>
                        <span className="inline-flex items-center rounded-md border border-blue-200/80 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0071e3]">
                            {assessmentType === 'diagnostic' ? 'Diagnostic Test' : 'Term Exam'}
                        </span>
                    </div>

                    {/* Dynamic Context Template: School Year, Term, Grade Scope, Subject (if filtered), Section (if filtered) */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 font-medium pt-0.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                            </svg>
                            S.Y. {activeSYName}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="inline-flex items-center gap-1 text-slate-700">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {activeTermName}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-[#0071e3]">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#0071e3]">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                <path d="M6 12v5c3 3 9 3 12 0v-5" />
                            </svg>
                            {currentGradeLabel}
                        </span>

                        {selectedSubjectName && (
                            <>
                                <span className="text-slate-300">•</span>
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200/80">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600">
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                                    </svg>
                                    Subject: {selectedSubjectName}
                                </span>
                            </>
                        )}

                        {selectedSectionId && (
                            <>
                                <span className="text-slate-300">•</span>
                                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-800 border border-indigo-200/80">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                    </svg>
                                    Section: {activeSectionName}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Right: Funnel / Filter Toggle Button */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => setShowFilters((prev) => !prev)}
                        className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3.5 text-xs font-bold transition-all shadow-2xs ${
                            showFilters
                                ? 'border-[#0071e3] bg-[#0071e3] text-white shadow-blue-500/20'
                                : 'border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                        title={showFilters ? 'Hide filter controls' : 'Show filter controls'}
                        aria-expanded={showFilters}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                        </svg>
                        <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
                        {hasActiveFilters && !showFilters && (
                            <span
                                className="flex size-2 rounded-full bg-[#0071e3]"
                                title="Active filters applied"
                            />
                        )}
                    </button>
                </div>
            </div>

            {/* Collapsible Filter Toolbar Card (Only shown when Funnel is clicked) */}
            {showFilters && (
                <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3 shadow-2xs animate-in fade-in duration-150">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Assessment Type Switcher */}
                        <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200/90 mr-1 shadow-2xs">
                            <button
                                type="button"
                                onClick={() => setAssessmentType('term_exam')}
                                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                                    assessmentType === 'term_exam'
                                        ? 'bg-blue-50 text-[#0071e3] shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Term Exam
                            </button>
                            <button
                                type="button"
                                onClick={() => setAssessmentType('diagnostic')}
                                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                                    assessmentType === 'diagnostic'
                                        ? 'bg-blue-50 text-[#0071e3] shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Diagnostic Test
                            </button>
                        </div>

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
                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                                </svg>
                            }
                            label="Grade"
                            value={selectedGradeId}
                            displayValue={selectedGradeId ? (currentGradeObj?.display_name || currentGradeObj?.name || `Grade ${currentGradeObj?.level}`) : 'School-Wide (All)'}
                            options={gradeOptions}
                            onChange={setSelectedGradeId}
                            onClear={() => setSelectedGradeId('')}
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

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedSectionId('');
                                    setSelectedSubjectName('');
                                    setSelectedGradeId('');
                                }}
                                className="inline-flex h-9 items-center gap-1 rounded-xl px-2.5 text-xs font-semibold text-slate-600 hover:bg-white hover:text-slate-900 transition border border-transparent hover:border-slate-200"
                            >
                                ✕ Reset filters
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowFilters(false)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-200/80 hover:text-slate-900 transition"
                            title="Close filter toolbar"
                        >
                            ✕ Done
                        </button>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
                    {errorMessage}
                </div>
            )}

            {/* EXECUTIVE SUMMARY KPI PANELS: MEAN, SD, MPS, MASTERY DISTRIBUTION */}
            {filteredRecords.length > 0 && !loadingData && (
                <div className="no-print grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {/* 1. OVERALL MEAN */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs flex flex-col justify-between">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Overall Mean</div>
                        <div className="mt-1 text-2xl font-extrabold text-slate-800">{summary.overallMean.toFixed(2)}</div>
                        <div className="mt-0.5 text-[10px] text-slate-400 font-medium">Average Score</div>
                    </div>

                    {/* 2. STANDARD DEVIATION */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs flex flex-col justify-between">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Standard Deviation</div>
                        <div className="mt-1 text-2xl font-extrabold text-slate-800">{summary.overallSd.toFixed(2)}</div>
                        <div className="mt-0.5 text-[10px] text-slate-400 font-medium">Dispersion (SD)</div>
                    </div>

                    {/* 3. OVERALL MPS */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs flex flex-col justify-between">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Overall MPS</div>
                        <div className={`mt-1 text-2xl font-extrabold ${summary.overallMps >= 75 ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {summary.overallMps.toFixed(2)}%
                        </div>
                        <div className="mt-0.5 text-[10px] text-slate-500 font-medium">DepEd Target: 75.00%</div>
                    </div>

                    {/* 4. OVERALL MASTERY LEVEL RESULT */}
                    {(() => {
                        const mps = summary.overallMps || 0;
                        let label = 'Absolutely No Mastery';
                        let colorClass = 'text-slate-700';
                        let bracket = '0–4%';
                        let bgBadge = 'bg-slate-100 border-slate-200 text-slate-700';

                        if (mps >= 96) {
                            label = 'Mastered';
                            colorClass = 'text-emerald-700';
                            bracket = '96–100%';
                            bgBadge = 'bg-emerald-50 border-emerald-200 text-emerald-800';
                        } else if (mps >= 86) {
                            label = 'Closely Approximating Mastery';
                            colorClass = 'text-emerald-600';
                            bracket = '86–95%';
                            bgBadge = 'bg-emerald-50 border-emerald-200 text-emerald-700';
                        } else if (mps >= 66) {
                            label = 'Moving Towards Mastery';
                            colorClass = 'text-sky-700';
                            bracket = '66–85%';
                            bgBadge = 'bg-sky-50 border-sky-200 text-sky-800';
                        } else if (mps >= 35) {
                            label = 'Average';
                            colorClass = 'text-amber-700';
                            bracket = '35–65%';
                            bgBadge = 'bg-amber-50 border-amber-200 text-amber-800';
                        } else if (mps >= 15) {
                            label = 'Low';
                            colorClass = 'text-orange-700';
                            bracket = '15–34%';
                            bgBadge = 'bg-orange-50 border-orange-200 text-orange-800';
                        } else if (mps >= 5) {
                            label = 'Very Low';
                            colorClass = 'text-rose-700';
                            bracket = '5–14%';
                            bgBadge = 'bg-rose-50 border-rose-200 text-rose-800';
                        }

                        return (
                            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                        Mastery Level Result
                                    </span>
                                    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-bold ${bgBadge}`}>
                                        {bracket}
                                    </span>
                                </div>
                                <div className={`mt-1 text-xl font-extrabold truncate ${colorClass}`} title={label}>
                                    {label}
                                </div>
                                <div className="mt-0.5 text-[10px] text-slate-400 font-medium">
                                    DepEd Proficiency Classification
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* REPORT TABLES & DATA FEED */}
            {loadingData ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 rounded-2xl border border-slate-200 bg-white shadow-2xs">
                    <LoadingIndicator type="dot-circle" size="md" label="Loading consolidated performance records…" />
                </div>
            ) : reportTableGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 rounded-2xl border border-slate-200 bg-white shadow-2xs text-center">
                    <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <div className="text-sm font-semibold text-slate-800">No records found</div>
                    <div className="text-xs text-slate-500 max-w-sm">
                        No assessment records match the selected school year, term, and filter scope.
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {reportTableGroups.map((group) => (
                        <div
                            key={group.id}
                            className="report-table-block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs"
                        >
                                {/* Table Body */}
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left text-xs">
                                        <thead>
                                            {/* Unified Table Title: Part of table, Green background, White text, Center aligned */}
                                            <tr className="bg-[#1e5622] text-white">
                                                <th
                                                    colSpan={16}
                                                    className="border border-green-800 px-4 py-3 text-center text-sm md:text-base font-extrabold uppercase tracking-wide text-white"
                                                >
                                                    {group.title}
                                                </th>
                                            </tr>
                                            <tr className="bg-[#1e5622] text-white font-bold uppercase tracking-wider text-[11px]">
                                                <th rowSpan="2" className="border border-green-800 px-3 py-3 whitespace-nowrap">
                                                    {group.rowHeaderLabel}
                                                </th>
                                                <th rowSpan="2" className="border border-green-800 px-2.5 py-3 text-center whitespace-nowrap">No. of Cases</th>
                                                <th rowSpan="2" className="border border-green-800 px-2.5 py-3 text-center whitespace-nowrap">Highest</th>
                                                <th rowSpan="2" className="border border-green-800 px-2.5 py-3 text-center whitespace-nowrap">Lowest</th>
                                                <th rowSpan="2" className="border border-green-800 px-2.5 py-3 text-center whitespace-nowrap">Mean</th>
                                                <th rowSpan="2" className="border border-green-800 px-2.5 py-3 text-center whitespace-nowrap">SD</th>
                                                <th rowSpan="2" className="border border-green-800 px-3 py-3 text-center whitespace-nowrap bg-[#17441a]">DepEd MPS</th>
                                                <th colSpan="7" className="border border-green-800 px-2 py-2 text-center bg-[#133816] tracking-normal font-semibold">
                                                    Mastery Level Distribution (No. of Examinees)
                                                </th>
                                                <th rowSpan="2" className="border border-green-800 px-3 py-3 min-w-[180px]">Least Learned Competency</th>
                                                <th rowSpan="2" className="border border-green-800 px-3 py-3 text-center bg-[#256a29] whitespace-nowrap">Remarks</th>
                                            </tr>
                                            <tr className="bg-[#246528] text-white text-[10px] font-semibold">
                                                <th className="border border-green-800 px-2 py-1.5 text-center whitespace-nowrap">Mastered<br /><span className="font-mono opacity-80">96-100%</span></th>
                                                <th className="border border-green-800 px-2 py-1.5 text-center whitespace-nowrap">Closely Approx.<br /><span className="font-mono opacity-80">86-95%</span></th>
                                                <th className="border border-green-800 px-2 py-1.5 text-center whitespace-nowrap">Moving Towards<br /><span className="font-mono opacity-80">66-85%</span></th>
                                                <th className="border border-green-800 px-2 py-1.5 text-center whitespace-nowrap">Average<br /><span className="font-mono opacity-80">35-65%</span></th>
                                                <th className="border border-green-800 px-2 py-1.5 text-center whitespace-nowrap">Low<br /><span className="font-mono opacity-80">15-34%</span></th>
                                                <th className="border border-green-800 px-2 py-1.5 text-center whitespace-nowrap">Very Low<br /><span className="font-mono opacity-80">5-14%</span></th>
                                                <th className="border border-green-800 px-2 py-1.5 text-center whitespace-nowrap">No Mastery<br /><span className="font-mono opacity-80">0-4%</span></th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-200">
                                            {group.records.map((record) => {
                                                const mps = Number(record.mps || 0);
                                                const dist = record.mastery || getMasteryDistribution(record.raw_scores, record.total_items || 50);
                                                const rowTitle = record.displayName || (
                                                    group.rowHeaderLabel === 'Section'
                                                        ? (record.section?.name || 'Section')
                                                        : (group.rowHeaderLabel === 'Grade Level'
                                                            ? (record.grade_level?.display_name || record.grade_level?.name || `Grade ${record.grade_level?.level}`)
                                                            : (record.subject?.name || 'Subject'))
                                                );

                                                return (
                                                    <tr key={record.id} className="odd:bg-white even:bg-slate-50/70 hover:bg-emerald-50/30 transition text-sm">
                                                        <td className="whitespace-nowrap border-r border-slate-200 px-3 py-3 font-semibold text-slate-900">
                                                            {rowTitle}
                                                        </td>
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center font-bold text-slate-900 text-sm">
                                                            {record.no_of_entries}
                                                        </td>
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center text-slate-700 text-sm">
                                                            {record.highest_score !== null && record.highest_score !== undefined ? Number(record.highest_score).toFixed(2) : '—'}
                                                        </td>
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center text-slate-700 text-sm">
                                                            {record.lowest_score !== null && record.lowest_score !== undefined ? Number(record.lowest_score).toFixed(2) : '—'}
                                                        </td>
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center text-slate-700 font-semibold text-sm">
                                                            {Number(record.mean || 0).toFixed(2)}
                                                        </td>
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center text-slate-700 text-sm">
                                                            {Number(record.sd || 0).toFixed(2)}
                                                        </td>
                                                        <td className={`border-r border-slate-200 px-2.5 py-3 text-center font-bold text-sm ${mps >= 75 ? 'text-emerald-700 bg-emerald-50/40' : 'text-amber-700 bg-amber-50/40'}`}>
                                                            {mps.toFixed(2)}%
                                                        </td>

                                                        {/* 7 Mastery Columns */}
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center font-bold text-emerald-800 bg-emerald-50/25 text-sm">{dist.mastered}</td>
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center font-bold text-emerald-800 bg-emerald-50/25 text-sm">{dist.closelyApproximating}</td>
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center font-bold text-sky-800 bg-sky-50/25 text-sm">{dist.movingTowards}</td>
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center font-bold text-amber-800 bg-amber-50/25 text-sm">{dist.average}</td>
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center font-bold text-orange-800 bg-orange-200/30 text-sm">{dist.low}</td>
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center font-bold text-red-800 bg-red-50/25 text-sm">{dist.veryLow}</td>
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center font-bold text-slate-800 bg-slate-50/50 text-sm">{dist.noMastery}</td>

                                                        <td className="border-r border-slate-200 px-3 py-3 text-slate-800 text-sm">
                                                            {record.least_learned_competency || <span className="text-slate-400 italic">None specified</span>}
                                                        </td>
                                                        <td className="border-r border-slate-200 px-3 py-3 text-center whitespace-nowrap">
                                                            {(() => {
                                                                const isMet = record.remarks === 'Met Target' || (!record.remarks && mps >= 75);
                                                                const remarksText = record.remarks || (mps >= 75 ? 'Met Target' : 'Intervention Needed');
                                                                return (
                                                                    <span className={`rounded-full px-3 py-1 text-xs font-bold border ${
                                                                        isMet
                                                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                                                            : 'bg-amber-100 text-amber-800 border-amber-200'
                                                                    }`}>
                                                                        {remarksText}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>

                                        {/* Table Total / General Average Footer */}
                                        <tfoot className="border-t-2 border-slate-300 bg-slate-100/90 font-bold text-xs text-slate-800">
                                            {(() => {
                                                const tSummary = group.summary || computeStats(group.records);
                                                const isMet = tSummary.mps >= 75;
                                                return (
                                                    <tr className="hover:bg-slate-200/60 transition">
                                                        <td className="whitespace-nowrap border-r border-slate-200 px-3 py-3 font-extrabold uppercase text-slate-900 tracking-wider">
                                                            Total / General Average
                                                        </td>
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center font-extrabold text-slate-900 text-sm">
                                                            {tSummary.totalExaminees}
                                                        </td>
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center text-slate-800 font-semibold text-sm">
                                                            {tSummary.highestScore !== null && tSummary.highestScore !== undefined ? Number(tSummary.highestScore).toFixed(2) : '—'}
                                                        </td>
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center text-slate-800 font-semibold text-sm">
                                                            {tSummary.lowestScore !== null && tSummary.lowestScore !== undefined ? Number(tSummary.lowestScore).toFixed(2) : '—'}
                                                        </td>
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center text-slate-900 font-extrabold text-sm">
                                                            {Number(tSummary.mean || 0).toFixed(2)}
                                                        </td>
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center text-slate-900 font-bold text-sm">
                                                            {Number(tSummary.sd || 0).toFixed(2)}
                                                        </td>
                                                        <td className={`border-r border-slate-200 px-2.5 py-3 text-center font-extrabold text-sm ${isMet ? 'text-emerald-800 bg-emerald-100/60' : 'text-amber-800 bg-amber-100/60'}`}>
                                                            {Number(tSummary.mps || 0).toFixed(2)}%
                                                        </td>

                                                        {/* 7 Mastery Columns */}
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center font-extrabold text-emerald-900 bg-emerald-100/40 text-sm">
                                                            {tSummary.mastery?.mastered || 0}
                                                        </td>
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center font-extrabold text-emerald-900 bg-emerald-100/40 text-sm">
                                                            {tSummary.mastery?.closelyApproximating || 0}
                                                        </td>
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center font-extrabold text-sky-900 bg-sky-100/40 text-sm">
                                                            {tSummary.mastery?.movingTowards || 0}
                                                        </td>
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center font-extrabold text-amber-900 bg-amber-100/40 text-sm">
                                                            {tSummary.mastery?.average || 0}
                                                        </td>
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center font-extrabold text-orange-900 bg-orange-200/40 text-sm">
                                                            {tSummary.mastery?.low || 0}
                                                        </td>
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center font-extrabold text-red-900 bg-red-100/40 text-sm">
                                                            {tSummary.mastery?.veryLow || 0}
                                                        </td>
                                                        <td className="border-r border-slate-200 px-2 py-3 text-center font-extrabold text-slate-900 bg-slate-200/60 text-sm">
                                                            {tSummary.mastery?.noMastery || 0}
                                                        </td>

                                                        <td className="border-r border-slate-200 px-3 py-3 text-slate-700 text-xs font-semibold">
                                                            {tSummary.leastLearned || <span className="text-slate-400 italic">—</span>}
                                                        </td>
                                                        <td className="border-r border-slate-200 px-3 py-3 text-center whitespace-nowrap">
                                                            <span className={`rounded-full px-3 py-1 text-xs font-extrabold border shadow-2xs ${
                                                                isMet
                                                                    ? 'bg-emerald-600 text-white border-emerald-700'
                                                                    : 'bg-amber-600 text-white border-amber-700'
                                                            }`}>
                                                                {isMet ? 'Met Target' : 'Intervention Needed'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })()}
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}
