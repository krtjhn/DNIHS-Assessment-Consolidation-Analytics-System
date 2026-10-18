import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../api';
import ScoreSheet from '../../components/ScoreSheet';
import LoadingIndicator from '../../components/LoadingIndicator';

export default function RecordEntry({ user }) {
    const isTeacher = user?.roles?.some((r) => r.name === 'teacher');

    const [refData, setRefData] = useState({
        grade_levels: [],
        school_years: [],
        terms: [],
        subjects: [],
        sections: [],
        active_sy: null,
    });
    const [teacherAssignments, setTeacherAssignments] = useState([]);
    const [existingRecords, setExistingRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    // Selector parameters
    const [selectedTermId, setSelectedTermId] = useState('');
    const [assessmentType, setAssessmentType] = useState('term_exam'); // 'term_exam' | 'diagnostic'
    const [selectedGradeId, setSelectedGradeId] = useState('');
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');

    // Workflow state: 'selector' | 'score_grid'
    const [currentStep, setCurrentStep] = useState('selector');
    const [editingRecord, setEditingRecord] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [refsRes, sectionsRes, assessmentsRes, myClassesRes] = await Promise.all([
                api.get('/reference-data'),
                api.get('/sections'),
                api.get('/assessments'),
                isTeacher ? api.get('/my-classes').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
            ]);

            // Scope terms strictly to active School Year (prevents duplicate terms across school years)
            const activeYear = refsRes.active_sy || (refsRes.school_years || []).find((sy) => sy.is_active) || refsRes.school_years?.[0];
            const extractedTerms = activeYear?.terms || [];

            const combinedRefs = {
                ...refsRes,
                terms: extractedTerms,
                sections: sectionsRes.data || [],
                active_sy: activeYear,
            };

            const assignments = myClassesRes?.data || [];
            setRefData(combinedRefs);
            setTeacherAssignments(assignments);
            setExistingRecords(assessmentsRes.data || []);

            // Set initial defaults
            const activeTerm = extractedTerms.find((t) => t.status === 'active') || extractedTerms[0];
            if (activeTerm && !selectedTermId) setSelectedTermId(String(activeTerm.id));

            if (assignments.length > 0) {
                const firstAssignment = assignments[0];
                if (!selectedGradeId && firstAssignment.section?.grade_level_id) {
                    setSelectedGradeId(String(firstAssignment.section.grade_level_id));
                }
                if (!selectedSectionId && firstAssignment.section_id) {
                    setSelectedSectionId(String(firstAssignment.section_id));
                }
                if (!selectedSubjectId && firstAssignment.subject_id) {
                    setSelectedSubjectId(String(firstAssignment.subject_id));
                }
            }
        } catch (err) {
            console.error('Error loading reference data:', err);
        } finally {
            setLoading(false);
        }
    }

    // Active SY
    const activeSY = useMemo(() => {
        return refData.active_sy || refData.school_years?.find((s) => s.is_active) || refData.school_years?.[0] || null;
    }, [refData.active_sy, refData.school_years]);

    // Check whether the teacher has any active teaching assignments
    const hasAssignments = Boolean(teacherAssignments && teacherAssignments.length > 0);

    // Available Grade Levels: strictly scoped to assigned teaching loads (NO fallback to all school grades)
    const availableGradeLevels = useMemo(() => {
        if (!hasAssignments) return [];
        const gradeMap = new Map();
        for (const a of teacherAssignments) {
            const gl =
                a.section?.grade_level ||
                (a.section?.grade_level_id
                    ? refData.grade_levels?.find((g) => g.id === a.section.grade_level_id)
                    : null);
            if (gl && !gradeMap.has(gl.id)) {
                gradeMap.set(gl.id, gl);
            }
        }
        return Array.from(gradeMap.values()).sort((a, b) => a.level - b.level);
    }, [hasAssignments, teacherAssignments, refData.grade_levels]);

    // Synchronize selectedGradeId
    useEffect(() => {
        if (availableGradeLevels.length > 0) {
            if (!availableGradeLevels.some((g) => String(g.id) === String(selectedGradeId))) {
                setSelectedGradeId(String(availableGradeLevels[0].id));
            }
        } else if (selectedGradeId) {
            setSelectedGradeId('');
        }
    }, [availableGradeLevels, selectedGradeId]);

    // Available sections: strictly scoped to assigned teaching loads for the chosen grade (NO fallback to all sections)
    const availableSections = useMemo(() => {
        if (!hasAssignments) return [];
        const secMap = new Map();
        for (const a of teacherAssignments) {
            if (!a.section) continue;
            if (selectedGradeId && String(a.section.grade_level_id) !== String(selectedGradeId)) {
                continue;
            }
            if (!secMap.has(a.section.id)) {
                secMap.set(a.section.id, a.section);
            }
        }
        return Array.from(secMap.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [hasAssignments, teacherAssignments, selectedGradeId]);

    // Synchronize selectedSectionId
    useEffect(() => {
        if (availableSections.length > 0) {
            if (!availableSections.some((s) => String(s.id) === String(selectedSectionId))) {
                setSelectedSectionId(String(availableSections[0].id));
            }
        } else if (selectedSectionId) {
            setSelectedSectionId('');
        }
    }, [availableSections, selectedSectionId]);

    // Available subjects: strictly scoped to assigned teaching loads for selected section & grade (NO fallback to all subjects)
    const availableSubjects = useMemo(() => {
        if (!hasAssignments) return [];
        const subjMap = new Map();
        for (const a of teacherAssignments) {
            if (!a.subject) continue;
            if (selectedSectionId && String(a.section_id) !== String(selectedSectionId)) {
                continue;
            }
            if (selectedGradeId && String(a.section?.grade_level_id) !== String(selectedGradeId)) {
                continue;
            }
            if (!subjMap.has(a.subject.id)) {
                subjMap.set(a.subject.id, a.subject);
            }
        }
        return Array.from(subjMap.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [hasAssignments, teacherAssignments, selectedGradeId, selectedSectionId]);

    // Synchronize selectedSubjectId
    useEffect(() => {
        if (availableSubjects.length > 0) {
            if (!availableSubjects.some((s) => String(s.id) === String(selectedSubjectId))) {
                setSelectedSubjectId(String(availableSubjects[0].id));
            }
        } else if (selectedSubjectId) {
            setSelectedSubjectId('');
        }
    }, [availableSubjects, selectedSubjectId]);

    // Selected objects
    const selectedTerm = useMemo(() => refData.terms?.find((t) => String(t.id) === String(selectedTermId)), [refData.terms, selectedTermId]);
    const isTermOpen = selectedTerm?.status === 'active';

    const selectedGrade = useMemo(
        () => availableGradeLevels.find((g) => String(g.id) === String(selectedGradeId)) || refData.grade_levels?.find((g) => String(g.id) === String(selectedGradeId)),
        [availableGradeLevels, refData.grade_levels, selectedGradeId]
    );
    const selectedSection = useMemo(
        () => availableSections.find((s) => String(s.id) === String(selectedSectionId)) || refData.sections?.find((s) => String(s.id) === String(selectedSectionId)),
        [availableSections, refData.sections, selectedSectionId]
    );
    const selectedSubject = useMemo(
        () => availableSubjects.find((s) => String(s.id) === String(selectedSubjectId)) || refData.subjects?.find((s) => String(s.id) === String(selectedSubjectId)),
        [availableSubjects, refData.subjects, selectedSubjectId]
    );

    // Existing record detection to prevent silent overwrite and allow 1-click continuation
    const existingMatch = useMemo(() => {
        if (!selectedTermId || !selectedSectionId || !selectedSubjectId) return null;
        const isExam = assessmentType === 'term_exam';
        return (
            existingRecords.find(
                (r) =>
                    String(r.term_id) === String(selectedTermId) &&
                    String(r.section_id) === String(selectedSectionId) &&
                    String(r.subject_id) === String(selectedSubjectId) &&
                    (isExam ? r.type === 'term_exam' : r.type === 'diagnostic')
            ) || null
        );
    }, [existingRecords, selectedTermId, selectedSectionId, selectedSubjectId, assessmentType]);

    // Launch score sheet
    function handleOpenScoreSheet(record = null) {
        if (record) {
            setEditingRecord(record);
            setSelectedTermId(String(record.term_id));
            setSelectedGradeId(String(record.grade_level_id));
            setSelectedSectionId(String(record.section_id));
            setSelectedSubjectId(String(record.subject_id));
            setAssessmentType(record.type === 'diagnostic' ? 'diagnostic' : 'term_exam');
        } else if (existingMatch) {
            setEditingRecord(existingMatch);
        } else {
            setEditingRecord(null);
        }
        setCurrentStep('score_grid');
    }

    // Delete record handler
    async function handleDeleteRecord(id) {
        if (!confirm('Are you sure you want to delete this recorded score sheet?')) return;
        try {
            await api.delete(`/assessments/${id}`);
            await loadData();
        } catch (err) {
            alert(err.message || 'Failed to delete record.');
        }
    }

    if (currentStep === 'score_grid') {
        return (
            <ScoreSheet
                user={user}
                selectedTerm={selectedTerm}
                selectedSY={activeSY}
                selectedGrade={selectedGrade}
                selectedSection={selectedSection}
                selectedSubject={selectedSubject}
                assessmentType={assessmentType}
                existingRecord={editingRecord}
                onBack={() => setCurrentStep('selector')}
                onRecordSaved={async () => {
                    await loadData();
                    setCurrentStep('selector');
                }}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Class Selector Card */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Class & Exam Parameters</h3>
                        {hasAssignments && (
                            <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-[#0071e3]">
                                {teacherAssignments.length} Assigned Class{teacherAssignments.length !== 1 ? 'es' : ''}
                            </span>
                        )}
                    </div>
                    <div className="text-xs font-semibold text-slate-500">
                        SY {activeSY?.year || '2025-2026'}
                    </div>
                </div>

                {!loading && !hasAssignments ? (
                    <div className="rounded-xl border border-amber-200/90 bg-amber-50/70 p-5 text-center space-y-2.5">
                        <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-2xs">
                            <svg className="size-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                            No Assigned Teaching Load for SY {activeSY?.year || '2025-2026'}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-amber-800/90 max-w-md mx-auto leading-relaxed">
                            You are not currently assigned to teach any section or subject. Per school policy, assessment score recording is restricted to officially assigned faculty. Please contact the School Administrator to assign your teaching load in <strong>Class Assignments</strong>.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
                            {/* Term Selector */}
                            <div>
                                <label htmlFor="term-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Academic Term
                                </label>
                                <select
                                    id="term-select"
                                    value={selectedTermId}
                                    onChange={(e) => setSelectedTermId(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] shadow-2xs"
                                >
                                    {refData.terms?.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} {t.status === 'active' ? '— (Open)' : `— (${t.status === 'completed' ? 'Completed' : 'Pending'})`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Assessment Type */}
                            <div>
                                <label htmlFor="type-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Assessment Type
                                </label>
                                <select
                                    id="type-select"
                                    value={assessmentType}
                                    onChange={(e) => setAssessmentType(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] shadow-2xs"
                                >
                                    <option value="term_exam">Term Examination</option>
                                    <option value="diagnostic">Diagnostic Assessment</option>
                                </select>
                            </div>

                            {/* Grade Level */}
                            <div>
                                <label htmlFor="grade-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Grade Level
                                </label>
                                <select
                                    id="grade-select"
                                    value={selectedGradeId}
                                    onChange={(e) => setSelectedGradeId(e.target.value)}
                                    disabled={availableGradeLevels.length === 0}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] shadow-2xs disabled:bg-slate-50 disabled:text-slate-400"
                                >
                                    {availableGradeLevels.map((g) => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Section */}
                            <div>
                                <label htmlFor="section-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Section
                                </label>
                                <select
                                    id="section-select"
                                    value={selectedSectionId}
                                    onChange={(e) => setSelectedSectionId(e.target.value)}
                                    disabled={availableSections.length === 0}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] shadow-2xs disabled:bg-slate-50 disabled:text-slate-400"
                                >
                                    {availableSections.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject */}
                            <div>
                                <label htmlFor="subject-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Subject / Learning Area
                                </label>
                                <select
                                    id="subject-select"
                                    value={selectedSubjectId}
                                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                                    disabled={availableSubjects.length === 0}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] shadow-2xs disabled:bg-slate-50 disabled:text-slate-400"
                                >
                                    {availableSubjects.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Action Button */}
                            <div className="flex items-end">
                                <button
                                    type="button"
                                    disabled={
                                        (!isTermOpen && !existingMatch) ||
                                        availableGradeLevels.length === 0 ||
                                        availableSections.length === 0 ||
                                        availableSubjects.length === 0
                                    }
                                    onClick={() => handleOpenScoreSheet(existingMatch)}
                                    className={`w-full flex h-9.5 items-center justify-center rounded-xl px-4 text-xs font-semibold transition shadow-2xs active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 ${
                                        existingMatch
                                            ? !isTermOpen
                                                ? 'bg-slate-700 hover:bg-slate-800 text-white focus-visible:ring-slate-700'
                                                : 'bg-amber-600 hover:bg-amber-700 text-white focus-visible:ring-amber-500'
                                            : !isTermOpen
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                            : 'bg-[#0071e3] hover:bg-[#0077ed] text-white focus-visible:ring-[#0071e3]'
                                    }`}
                                >
                                    {existingMatch
                                        ? !isTermOpen
                                            ? 'View Saved Scores'
                                            : 'Edit Existing Record'
                                        : !isTermOpen
                                        ? 'Term Locked'
                                        : 'Open Score Sheet'}
                                </button>
                            </div>
                        </div>

                        {/* Existing Match Alert */}
                        {existingMatch && (
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs text-amber-900">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">Assessment Already Recorded:</span>
                                    <span>
                                        Mean: <strong>{existingMatch.mean}</strong>, MPS: <strong>{existingMatch.mps}%</strong> ({existingMatch.mastery_level || 'Evaluated'}).
                                    </span>
                                </div>
                                <span className="text-[11px] font-semibold text-amber-700">
                                    {!isTermOpen ? 'Term is closed. Scores are read-only.' : 'Opening will edit this existing sheet.'}
                                </span>
                            </div>
                        )}

                        {/* Closed Term Status Alert */}
                        {!isTermOpen && selectedTerm && (
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
                                <svg className="size-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span>
                                    <strong>{selectedTerm.name}</strong> is currently {selectedTerm.status === 'completed' ? 'completed/closed' : 'pending'}. New score recording is locked.
                                </span>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Previously Recorded Sheets Table */}
            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Recorded Score Sheets</h3>
                        <p className="text-[11px] text-slate-500">Previously saved assessments and computed analytics.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                        {existingRecords.length} Records
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                <th className="py-3 px-4">Subject</th>
                                <th className="py-3 px-4">Type</th>
                                <th className="py-3 px-4">No. of Cases</th>
                                <th className="py-3 px-4">Mean</th>
                                <th className="py-3 px-4">MPS</th>
                                <th className="py-3 px-4">Mastery</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {existingRecords.length > 0 ? (
                                existingRecords.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="py-3 px-4 font-semibold text-slate-900">
                                            {r.section?.name || 'Section'} • <span className="text-slate-500 font-normal">{r.subject?.name || 'Subject'}</span>
                                        </td>
                                        <td className="py-3 px-4 text-[10px] font-bold text-slate-600">
                                            {r.type === 'diagnostic' ? 'Diagnostic' : 'Term Exam'}
                                        </td>
                                        <td className="py-3 px-4 font-semibold text-slate-800">
                                            {r.no_of_entries || r.raw_scores?.length}
                                        </td>
                                        <td className="py-3 px-4 font-bold text-emerald-600">
                                            {r.mean}
                                        </td>
                                        <td className="py-3 px-4 font-bold text-[#0071e3]">
                                            {r.mps}%
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                                {r.mastery_level || 'Evaluated'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenScoreSheet(r)}
                                                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                                >
                                                    {r.term?.status === 'active' ? 'Open / Edit' : 'View Scores'}
                                                </button>
                                                {isTeacher && r.term?.status === 'active' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteRecord(r.id)}
                                                        className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center">
                                        {loading ? (
                                            <LoadingIndicator type="dot-circle" size="md" label="Loading assessments…" />
                                        ) : (
                                            <span className="text-xs text-slate-400">No recorded score sheets found yet.</span>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
