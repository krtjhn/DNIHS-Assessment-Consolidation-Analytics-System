import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../api';
import LoadingIndicator from './LoadingIndicator';

export default function ScoreSheet({
    selectedTerm,
    selectedSY,
    selectedGrade,
    selectedSection,
    selectedSubject,
    assessmentType = 'term_exam',
    existingRecord,
    onBack,
    onRecordSaved,
    onRecordDeleted,
}) {
    const isEditing = Boolean(existingRecord?.id);
    const [totalItems, setTotalItems] = useState(existingRecord?.total_items || 50);

    // Initialize students: load existing record rows or start with exactly 1 single student row
    const [students, setStudents] = useState(() => {
        if (existingRecord?.raw_scores && existingRecord.raw_scores.length > 0) {
            return existingRecord.raw_scores.map((score, i) => ({
                id: i + 1,
                name: `Student ${i + 1}`,
                score: score !== null && score !== undefined ? String(score) : '',
            }));
        }
        return [
            {
                id: 1,
                name: 'Student 1',
                score: '',
            },
        ];
    });

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const inputRefs = useRef([]);

    const [leastLearnedCompetency, setLeastLearnedCompetency] = useState(
        existingRecord?.least_learned_competency || ''
    );
    const [remarks, setRemarks] = useState(existingRecord?.remarks || 'Complete');

    const isLocked = Boolean(selectedTerm?.status && selectedTerm.status !== 'active');

    // Title: Grade Section - Subject [Diagnostic Test / Term Examination]
    const autoReportTitle = useMemo(() => {
        const gradeLabel = selectedGrade?.display_name || selectedGrade?.name || 'Grade';
        const sectionLabel = selectedSection?.name || '';
        const subjectLabel = selectedSubject?.name || 'Subject';
        const typeLabel = assessmentType === 'diagnostic' ? 'Diagnostic Test' : 'Term Examination';

        const classLabel = sectionLabel ? `${gradeLabel} ${sectionLabel}` : gradeLabel;
        return `${classLabel} - ${subjectLabel} ${typeLabel}`;
    }, [assessmentType, selectedGrade, selectedSection, selectedSubject]);

    // Helper to validate score input in real time
    const isScoreInvalid = (val) => {
        if (val === '' || val === null || val === undefined) return false;
        const num = Number(val);
        const max = Number(totalItems);
        return isNaN(num) || num < 0 || (max > 0 && num > max);
    };

    // Any invalid score currently entered
    const hasInvalidScores = useMemo(() => {
        return students.some((s) => isScoreInvalid(s.score));
    }, [students, totalItems]);

    // Parse valid numeric scores
    const validScores = useMemo(() => {
        return students
            .map((s) => parseFloat(s.score))
            .filter((s) => !isNaN(s) && s >= 0 && (totalItems ? s <= totalItems : true));
    }, [students, totalItems]);

    const canSubmit = !isLocked && !saving && validScores.length > 0 && !hasInvalidScores;

    // Handle single score input change
    function handleScoreChange(index, value) {
        if (isLocked) return;
        setStudents((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], score: value };
            return next;
        });
    }

    // Delete student row with automatic re-indexing
    function handleDeleteStudent(index) {
        if (isLocked) return;
        setStudents((prev) => {
            if (prev.length <= 1) {
                // If it is the only row, clear score instead of removing row
                return [{ id: 1, name: 'Student 1', score: '' }];
            }
            const updated = prev.filter((_, idx) => idx !== index);
            return updated.map((s, i) => ({
                ...s,
                id: i + 1,
                name: `Student ${i + 1}`,
            }));
        });
    }

    // Keyboard navigation: Enter on last row automatically appends the next student
    function handleKeyDown(e, index) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (index === students.length - 1) {
                // Automatically append the next student row
                setStudents((prev) => [
                    ...prev,
                    {
                        id: prev.length + 1,
                        name: `Student ${prev.length + 1}`,
                        score: '',
                    },
                ]);
                setTimeout(() => {
                    inputRefs.current[index + 1]?.focus();
                }, 15);
            } else {
                inputRefs.current[index + 1]?.focus();
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (index < students.length - 1) {
                inputRefs.current[index + 1]?.focus();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (index > 0) {
                inputRefs.current[index - 1]?.focus();
            }
        } else if (e.key === 'Backspace' && students[index].score === '') {
            // If the row is empty, not the only row, and at the end, remove it and step up
            if (students.length > 1 && index === students.length - 1) {
                e.preventDefault();
                setStudents((prev) => prev.slice(0, prev.length - 1));
                setTimeout(() => {
                    inputRefs.current[index - 1]?.focus();
                }, 15);
            }
        }
    }

    // Submit record to backend
    async function handleSubmitRecord() {
        if (isLocked || hasInvalidScores || validScores.length === 0) {
            return;
        }

        setSaving(true);
        setFeedback(null);

        const payload = {
            school_year_id: Number(selectedSY?.id),
            term_id: Number(selectedTerm?.id),
            grade_level_id: Number(selectedGrade?.id),
            section_id: Number(selectedSection?.id),
            subject_id: Number(selectedSubject?.id),
            type: assessmentType === 'diagnostic' ? 'diagnostic' : 'term_exam',
            total_items: Number(totalItems),
            raw_scores: validScores,
            least_learned_competency: leastLearnedCompetency || 'Not specified',
            remarks: remarks || 'Complete',
        };

        try {
            if (existingRecord?.id) {
                await api.put(`/assessments/${existingRecord.id}`, payload);
                setFeedback({ type: 'success', message: 'Assessment record updated successfully.' });
            } else {
                await api.post('/assessments', payload);
                setFeedback({ type: 'success', message: 'Assessment record submitted successfully.' });
            }
            onRecordSaved?.();
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || (isEditing ? 'Failed to update record.' : 'Failed to submit record.') });
        } finally {
            setSaving(false);
        }
    }

    // Delete record from backend
    async function handleDeleteRecord() {
        if (!existingRecord?.id || isLocked) return;

        const confirmed = window.confirm(
            'Are you sure you want to delete this assessment record? The assessment will be moved back to your Assigned list.'
        );
        if (!confirmed) return;

        setDeleting(true);
        setFeedback(null);

        try {
            await api.delete(`/assessments/${existingRecord.id}`);
            if (onRecordDeleted) {
                onRecordDeleted();
            } else {
                onRecordSaved?.();
            }
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'Failed to delete record.' });
            setDeleting(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Top Bar / Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98] shadow-2xs cursor-pointer"
                    >
                        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Back</span>
                    </button>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-sm font-bold tracking-tight text-slate-900">
                                {autoReportTitle}
                            </h2>
                            {isLocked && (
                                <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 shrink-0">
                                    Term Closed (Read-Only)
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 font-medium pt-0.5">
                            <span>S.Y. {selectedSY?.name || selectedSY?.year || '2025-2026'}</span>
                            <span>•</span>
                            <span>{selectedTerm?.name}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    {isEditing && !isLocked && (
                        <button
                            type="button"
                            disabled={deleting || saving}
                            onClick={handleDeleteRecord}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition-colors shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {deleting ? (
                                <span className="inline-flex items-center gap-1.5">
                                    <LoadingIndicator type="dot-circle" size="xs" className="text-rose-600" />
                                    <span>Deleting...</span>
                                </span>
                            ) : (
                                <>
                                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span>Delete</span>
                                </>
                            )}
                        </button>
                    )}

                    {!isLocked ? (
                        <motion.button
                            type="button"
                            whileHover={canSubmit ? { scale: 1.02 } : {}}
                            whileTap={canSubmit ? { scale: 0.98 } : {}}
                            disabled={!canSubmit || deleting}
                            onClick={handleSubmitRecord}
                            className="rounded-xl bg-[#0071e3] px-5 py-1.5 text-xs font-semibold text-white hover:bg-[#0077ed] transition-colors shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {saving ? (
                                <span className="inline-flex items-center gap-1.5">
                                    <LoadingIndicator type="dot-circle" size="xs" className="text-white" />
                                    <span>{isEditing ? 'Updating...' : 'Submitting...'}</span>
                                </span>
                            ) : (
                                isEditing ? 'Update' : 'Submit'
                            )}
                        </motion.button>
                    ) : (
                        <span className="rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-500">
                            Read-Only
                        </span>
                    )}
                </div>
            </div>

            {/* Locked Term Banner */}
            {isLocked && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 font-medium flex items-center gap-2">
                    <svg className="size-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>
                        <strong>Historical Record (Term is Closed):</strong> This term is completed or inactive. Scores and competencies are in read-only mode and cannot be modified.
                    </span>
                </div>
            )}

            {/* Feedback alert */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        key={feedback.message}
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className={`rounded-xl border p-3.5 text-xs font-medium ${
                            feedback.type === 'success'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : 'border-red-200 bg-red-50 text-red-700'
                        }`}
                    >
                        {feedback.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Area: Compact Excel-like Score Table + Qualitative Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Compact Excel-like Student Score Encoding Table */}
                <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/40">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Student Score Encoding</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                Type a score and press Enter to automatically add the next student.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <label htmlFor="total-items" className="text-xs font-semibold text-slate-600">Total Items:</label>
                                <input
                                    id="total-items"
                                    type="number"
                                    min="1"
                                    disabled={isLocked}
                                    value={totalItems}
                                    onChange={(e) => setTotalItems(Number(e.target.value))}
                                    className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-center font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="max-h-[520px] overflow-y-auto">
                        <table className="w-full border-collapse text-left text-xs">
                            <thead className="sticky top-0 bg-slate-100/90 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                <tr>
                                    <th className="py-2.5 px-3 border-r border-slate-200">Student</th>
                                    <th className="py-2.5 px-3 w-32 text-right border-r border-slate-200">Score</th>
                                    <th className="py-2.5 px-2 w-10 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.map((student, idx) => {
                                    const isInvalid = isScoreInvalid(student.score);
                                    return (
                                        <tr
                                            key={student.id}
                                            className={`transition-colors ${
                                                isInvalid ? 'bg-red-50/40' : 'hover:bg-blue-50/30'
                                            }`}
                                        >
                                            <td className={`py-1.5 px-3 font-semibold border-r border-slate-100 ${
                                                isInvalid ? 'text-red-900' : 'text-slate-800'
                                            }`}>
                                                {student.name}
                                            </td>
                                            <td className={`py-1.5 px-2 border-r border-slate-100 w-32 transition-colors ${
                                                isInvalid ? 'bg-red-50/60' : ''
                                            }`}>
                                                <input
                                                    ref={(el) => (inputRefs.current[idx] = el)}
                                                    type="number"
                                                    min="0"
                                                    max={totalItems}
                                                    disabled={isLocked}
                                                    value={student.score}
                                                    onChange={(e) => handleScoreChange(idx, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, idx)}
                                                    placeholder="0"
                                                    title={isInvalid ? `Score must be between 0 and ${totalItems}` : undefined}
                                                    className={`w-full rounded-md px-2.5 py-1 text-right text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
                                                        isInvalid
                                                            ? 'border-2 border-red-500 bg-red-50 text-red-600 focus-visible:ring-red-400 focus-visible:border-red-500'
                                                            : 'border border-slate-200 bg-white text-slate-900 placeholder:text-slate-300 focus-visible:ring-[#0071e3] focus-visible:border-transparent'
                                                    }`}
                                                />
                                            </td>
                                            <td className="py-1.5 px-1 text-center w-10">
                                                {!isLocked && (
                                                    <button
                                                        type="button"
                                                        tabIndex={-1}
                                                        onClick={() => handleDeleteStudent(idx)}
                                                        title="Remove student row"
                                                        className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                                    >
                                                        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Qualitative Item Analysis Card */}
                <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Qualitative Item Analysis</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Least Learned Competency
                            </label>
                            <input
                                type="text"
                                disabled={isLocked}
                                value={leastLearnedCompetency}
                                onChange={(e) => setLeastLearnedCompetency(e.target.value)}
                                placeholder="e.g. Operations on Polynomials"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Teacher's Remarks / Action Plan
                            </label>
                            <input
                                type="text"
                                disabled={isLocked}
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="e.g. Conduct remedial sessions"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
