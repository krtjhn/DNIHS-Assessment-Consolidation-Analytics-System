import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../api';
import ScoreSheet from '../../components/ScoreSheet';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';

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
            if (extractedTerms[0] && !selectedTermId) setSelectedTermId(String(extractedTerms[0].id));
            if (combinedRefs.grade_levels?.[0] && !selectedGradeId) setSelectedGradeId(String(combinedRefs.grade_levels[0].id));
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

    // Available Grade Levels: scoped to teaching loads if assigned
    const availableGradeLevels = useMemo(() => {
        if (!teacherAssignments || teacherAssignments.length === 0) {
            return refData.grade_levels || [];
        }
        const assignedGradeIds = new Set(
            teacherAssignments.map((a) => a.section?.grade_level_id).filter(Boolean)
        );
        if (assignedGradeIds.size === 0) return refData.grade_levels || [];
        const filtered = (refData.grade_levels || []).filter((g) => assignedGradeIds.has(g.id));
        return filtered.length > 0 ? filtered : (refData.grade_levels || []);
    }, [refData.grade_levels, teacherAssignments]);

    // Synchronize selectedGradeId
    useEffect(() => {
        if (availableGradeLevels.length > 0 && !availableGradeLevels.some((g) => String(g.id) === String(selectedGradeId))) {
            setSelectedGradeId(String(availableGradeLevels[0].id));
        }
    }, [availableGradeLevels, selectedGradeId]);

    // Available sections for chosen grade level & teaching load
    const availableSections = useMemo(() => {
        let secs = refData.sections || [];
        if (selectedGradeId) {
            secs = secs.filter((s) => String(s.grade_level_id) === String(selectedGradeId));
        }
        if (teacherAssignments && teacherAssignments.length > 0) {
            const assignedSectionIds = new Set(
                teacherAssignments
                    .filter((a) => !selectedGradeId || String(a.section?.grade_level_id) === String(selectedGradeId))
                    .map((a) => a.section_id)
                    .filter(Boolean)
            );
            if (assignedSectionIds.size > 0) {
                const assignedSecs = secs.filter((s) => assignedSectionIds.has(s.id));
                if (assignedSecs.length > 0) return assignedSecs;
            }
        }
        return secs;
    }, [refData.sections, selectedGradeId, teacherAssignments]);

    // Synchronize selectedSectionId
    useEffect(() => {
        if (availableSections.length > 0 && !availableSections.some((s) => String(s.id) === String(selectedSectionId))) {
            setSelectedSectionId(String(availableSections[0].id));
        }
    }, [availableSections, selectedSectionId]);

    // Available subjects: scoped to teaching loads, filtered by grade level, and deduplicated
    const availableSubjects = useMemo(() => {
        // 1. If teacher has specific assigned subjects for the selected section/grade
        if (teacherAssignments && teacherAssignments.length > 0) {
            const matchingAssignments = teacherAssignments.filter((a) => {
                const matchSec = !selectedSectionId || String(a.section_id) === String(selectedSectionId);
                const matchGrade = !selectedGradeId || String(a.section?.grade_level_id) === String(selectedGradeId);
                return matchSec && matchGrade;
            });
            const assignedSubjs = matchingAssignments.map((a) => a.subject).filter(Boolean);
            if (assignedSubjs.length > 0) {
                const seenIds = new Set();
                return assignedSubjs.filter((s) => {
                    if (seenIds.has(s.id)) return false;
                    seenIds.add(s.id);
                    return true;
                });
            }
        }

        // 2. Fallback: filter subjects by selectedGradeId and deduplicate by name
        let subjs = refData.subjects || [];
        if (selectedGradeId) {
            subjs = subjs.filter((s) => !s.grade_level_id || String(s.grade_level_id) === String(selectedGradeId));
        }

        const seenNames = new Set();
        const unique = [];
        for (const s of subjs) {
            if (!seenNames.has(s.name)) {
                seenNames.add(s.name);
                unique.push(s);
            }
        }
        return unique.length > 0 ? unique : (refData.subjects || []);
    }, [refData.subjects, selectedGradeId, selectedSectionId, teacherAssignments]);

    // Synchronize selectedSubjectId
    useEffect(() => {
        if (availableSubjects.length > 0 && !availableSubjects.some((s) => String(s.id) === String(selectedSubjectId))) {
            setSelectedSubjectId(String(availableSubjects[0].id));
        }
    }, [availableSubjects, selectedSubjectId]);

    // Selected objects
    const selectedTerm = useMemo(() => refData.terms?.find((t) => String(t.id) === String(selectedTermId)), [refData.terms, selectedTermId]);
    const selectedGrade = useMemo(() => refData.grade_levels?.find((g) => String(g.id) === String(selectedGradeId)), [refData.grade_levels, selectedGradeId]);
    const selectedSection = useMemo(() => refData.sections?.find((s) => String(s.id) === String(selectedSectionId)), [refData.sections, selectedSectionId]);
    const selectedSubject = useMemo(() => refData.subjects?.find((s) => String(s.id) === String(selectedSubjectId)), [refData.subjects, selectedSubjectId]);

    // Launch score sheet
    function handleOpenScoreSheet(record = null) {
        if (record) {
            setEditingRecord(record);
            setSelectedTermId(String(record.term_id));
            setSelectedGradeId(String(record.grade_level_id));
            setSelectedSectionId(String(record.section_id));
            setSelectedSubjectId(String(record.subject_id));
            setAssessmentType(record.type === 'diagnostic' ? 'diagnostic' : 'term_exam');
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
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Class & Exam Parameters</h3>
                    <div className="text-xs font-semibold text-slate-500">
                        SY {activeSY?.year || '2025-2026'}
                    </div>
                </div>

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
                                <option key={t.id} value={t.id}>{t.name}</option>
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
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] shadow-2xs"
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
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] shadow-2xs"
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
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] shadow-2xs"
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
                            onClick={() => handleOpenScoreSheet(null)}
                            className="w-full flex h-9.5 items-center justify-center rounded-xl bg-[#0071e3] px-4 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#0077ed] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
                        >
                            Open Score Sheet →
                        </button>
                    </div>
                </div>
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
                                        <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-500">
                                            {r.type}
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
                                                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    Open / Edit
                                                </button>
                                                {isTeacher && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteRecord(r.id)}
                                                        className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
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
