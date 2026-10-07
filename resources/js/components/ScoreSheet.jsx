import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../api';

export default function ScoreSheet({
    user,
    selectedTerm,
    selectedSY,
    selectedGrade,
    selectedSection,
    selectedSubject,
    assessmentType = 'term_exam',
    existingRecord,
    onBack,
    onRecordSaved,
}) {
    const [totalItems, setTotalItems] = useState(existingRecord?.total_items || 50);

    // Initialize 45 student rows by default or from existing saved record
    const [students, setStudents] = useState(() => {
        if (existingRecord?.raw_scores && existingRecord.raw_scores.length > 0) {
            return existingRecord.raw_scores.map((score, i) => ({
                id: i + 1,
                name: `Examinee ${String(i + 1).padStart(2, '0')}`,
                score: score !== null && score !== undefined ? String(score) : '',
            }));
        }
        return Array.from({ length: 45 }, (_, i) => ({
            id: i + 1,
            name: `Examinee ${String(i + 1).padStart(2, '0')}`,
            score: '',
        }));
    });

    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [showPasteModal, setShowPasteModal] = useState(false);
    const [pasteRawText, setPasteRawText] = useState('');
    const [pasteError, setPasteError] = useState(null);

    const inputRefs = useRef([]);

    const [leastLearnedCompetency, setLeastLearnedCompetency] = useState(
        existingRecord?.least_learned_competency || ''
    );
    const [remarks, setRemarks] = useState(existingRecord?.remarks || 'Complete');

    // Parse valid scores
    const validScores = useMemo(() => {
        return students
            .map((s) => parseFloat(s.score))
            .filter((s) => !isNaN(s) && s >= 0);
    }, [students]);

    // Live DepEd Statistical Engine
    const stats = useMemo(() => {
        const n = validScores.length;
        if (n === 0 || totalItems <= 0) {
            return { n: 0, mean: '0.00', sd: '0.00', mps: '0.00', masteryLevel: 'Pending', masteryColor: 'bg-slate-100 text-slate-600' };
        }

        const sum = validScores.reduce((acc, v) => acc + v, 0);
        const mean = sum / n;
        const mps = (mean / totalItems) * 100;

        const sumSquaredDiff = validScores.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
        const sd = Math.sqrt(sumSquaredDiff / n);

        let masteryLevel = 'Absolutely No Mastery';
        let masteryColor = 'bg-red-100 text-red-800 border-red-300';

        if (mps >= 96) {
            masteryLevel = 'Mastered';
            masteryColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
        } else if (mps >= 86) {
            masteryLevel = 'Closely Approximating Mastery';
            masteryColor = 'bg-teal-100 text-teal-800 border-teal-300';
        } else if (mps >= 66) {
            masteryLevel = 'Moving Towards Mastery';
            masteryColor = 'bg-blue-100 text-blue-800 border-blue-300';
        } else if (mps >= 35) {
            masteryLevel = 'Average';
            masteryColor = 'bg-amber-100 text-amber-800 border-amber-300';
        } else if (mps >= 15) {
            masteryLevel = 'Low';
            masteryColor = 'bg-orange-100 text-orange-800 border-orange-300';
        } else if (mps >= 5) {
            masteryLevel = 'Very Low';
            masteryColor = 'bg-rose-100 text-rose-800 border-rose-300';
        }

        return {
            n,
            mean: mean.toFixed(2),
            sd: sd.toFixed(2),
            mps: mps.toFixed(2),
            masteryLevel,
            masteryColor,
        };
    }, [validScores, totalItems]);

    // Handle single score change
    function handleScoreChange(index, value) {
        setStudents((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], score: value };
            return next;
        });
    }

    // Keyboard navigation (Enter / Down Arrow to next examinee)
    function handleKeyDown(e, index) {
        if (e.key === 'Enter' || e.key === 'ArrowDown') {
            e.preventDefault();
            if (index < students.length - 1) {
                inputRefs.current[index + 1]?.focus();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (index > 0) {
                inputRefs.current[index - 1]?.focus();
            }
        }
    }

    // Quick Paste Modal parser
    function handleApplyPaste() {
        setPasteError(null);
        if (!pasteRawText.trim()) {
            setPasteError('Please paste some text with numbers.');
            return;
        }

        const numbers = pasteRawText
            .split(/[\r\n,]+/)
            .map((val) => val.trim())
            .filter((val) => val !== '' && !isNaN(parseFloat(val)))
            .map((val) => parseFloat(val));

        if (numbers.length === 0) {
            setPasteError('No valid numeric scores detected in pasted text.');
            return;
        }

        const outOfRange = numbers.find((n) => n < 0 || n > totalItems);
        if (outOfRange !== undefined) {
            setPasteError(`Score ${outOfRange} is out of valid range (0 to ${totalItems}).`);
            return;
        }

        setStudents(() => {
            return numbers.map((score, i) => ({
                id: i + 1,
                name: `Examinee ${String(i + 1).padStart(2, '0')}`,
                score: String(score),
            }));
        });

        setShowPasteModal(false);
        setPasteRawText('');
        setFeedback({ type: 'success', message: `Imported ${numbers.length} student scores successfully!` });
    }

    // Save record to backend
    async function handleSaveRecord() {
        setSaving(true);
        setFeedback(null);

        if (validScores.length === 0) {
            setFeedback({ type: 'error', message: 'Please encode at least one score before saving.' });
            setSaving(false);
            return;
        }

        const payload = {
            school_year_id: Number(selectedSY?.id),
            term_id: Number(selectedTerm?.id),
            grade_level_id: Number(selectedGrade?.id),
            section_id: Number(selectedSection?.id),
            subject_id: Number(selectedSubject?.id),
            type: assessmentType === 'term_exam' ? 'quarterly' : 'diagnostic',
            total_items: Number(totalItems),
            raw_scores: validScores,
            least_learned_competency: leastLearnedCompetency || 'Not specified',
            remarks: remarks || 'Complete',
        };

        try {
            if (existingRecord?.id) {
                await api.put(`/assessments/${existingRecord.id}`, payload);
            } else {
                await api.post('/assessments', payload);
            }
            setFeedback({ type: 'success', message: 'Assessment record saved with calculated DepEd statistics!' });
            onRecordSaved?.();
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'Failed to save record.' });
        } finally {
            setSaving(false);
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
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98] shadow-2xs"
                    >
                        ← Back to Class Selector
                    </button>
                    <div>
                        <div className="text-xs font-bold text-slate-900">
                            {selectedGrade?.name} • {selectedSection?.name} • {selectedSubject?.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                            {selectedTerm?.name} • {assessmentType === 'term_exam' ? 'Term Examination' : 'Diagnostic Test'}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowPasteModal(true)}
                        className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98] shadow-2xs"
                    >
                        📋 Paste from Excel / eCR
                    </button>
                    <button
                        type="button"
                        disabled={saving}
                        onClick={handleSaveRecord}
                        className="rounded-xl bg-[#0071e3] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0077ed] transition-all active:scale-[0.98] shadow-2xs disabled:opacity-50"
                    >
                        {saving ? 'Saving…' : 'Save Score Sheet'}
                    </button>
                </div>
            </div>

            {/* Feedback alert */}
            {feedback && (
                <div
                    className={`rounded-xl border p-3.5 text-xs font-medium ${
                        feedback.type === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                >
                    {feedback.message}
                </div>
            )}

            {/* Live DepEd Statistical Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Examinees (N)</div>
                    <div className="mt-1 text-2xl font-bold text-slate-900">{stats.n}</div>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mean (X̄)</div>
                    <div className="mt-1 text-2xl font-bold text-emerald-600">{stats.mean}</div>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pop. SD</div>
                    <div className="mt-1 text-2xl font-bold text-purple-600">{stats.sd}</div>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">MPS (%)</div>
                    <div className="mt-1 text-2xl font-bold text-[#0071e3]">{stats.mps}%</div>
                </div>
            </div>

            {/* DepEd Mastery Level Banner */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex items-center justify-between">
                <div>
                    <span className="text-xs font-semibold text-slate-500">Official DepEd Mastery Classification:</span>
                    <span className="ml-2 font-bold text-slate-900">{stats.masteryLevel}</span>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${stats.masteryColor}`}>
                    {stats.masteryLevel}
                </span>
            </div>

            {/* Score Grid Table */}
            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Student Score Encoding</h3>
                    <div className="flex items-center gap-2">
                        <label htmlFor="total-items" className="text-xs font-semibold text-slate-600">Total Items:</label>
                        <input
                            id="total-items"
                            type="number"
                            min="1"
                            value={totalItems}
                            onChange={(e) => setTotalItems(Number(e.target.value))}
                            className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs text-center font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
                        />
                    </div>
                </div>

                <div className="max-h-[460px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="py-2.5 px-4 w-16">#</th>
                                <th className="py-2.5 px-4">Student Name</th>
                                <th className="py-2.5 px-4 w-32 text-right">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.map((student, idx) => (
                                <tr key={student.id} className="hover:bg-slate-50/60">
                                    <td className="py-2 px-4 text-slate-400 font-medium">{student.id}</td>
                                    <td className="py-2 px-4 font-semibold text-slate-800">{student.name}</td>
                                    <td className="py-2 px-4 text-right">
                                        <input
                                            ref={(el) => (inputRefs.current[idx] = el)}
                                            type="number"
                                            min="0"
                                            max={totalItems}
                                            value={student.score}
                                            onChange={(e) => handleScoreChange(idx, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, idx)}
                                            placeholder="—"
                                            className="w-20 rounded-lg border border-slate-200 px-2.5 py-1 text-right text-xs font-bold text-slate-900 placeholder:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Qualitative Item Analysis Card */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Qualitative Item Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Least Learned Competency
                        </label>
                        <input
                            type="text"
                            value={leastLearnedCompetency}
                            onChange={(e) => setLeastLearnedCompetency(e.target.value)}
                            placeholder="e.g. Operations on Polynomials"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Teacher's Remarks / Action Plan
                        </label>
                        <input
                            type="text"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="e.g. Conduct remedial sessions"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
                        />
                    </div>
                </div>
            </div>

            {/* Paste Modal */}
            {showPasteModal && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
                >
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200/80">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="text-sm font-bold text-slate-900">Paste Scores from Excel / eCR</h3>
                            <button
                                type="button"
                                onClick={() => setShowPasteModal(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        {pasteError && (
                            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 font-medium">
                                {pasteError}
                            </div>
                        )}

                        <p className="text-xs text-slate-500 mb-2">
                            Copy a column of scores directly from Excel and paste it below:
                        </p>

                        <textarea
                            rows="6"
                            value={pasteRawText}
                            onChange={(e) => setPasteRawText(e.target.value)}
                            placeholder="45&#10;42&#10;38&#10;50&#10;..."
                            className="w-full rounded-xl border border-slate-200 p-3 text-xs font-mono text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
                        />

                        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 mt-4">
                            <button
                                type="button"
                                onClick={() => setShowPasteModal(false)}
                                className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleApplyPaste}
                                className="rounded-xl bg-[#0071e3] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0077ed]"
                            >
                                Apply Scores
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
