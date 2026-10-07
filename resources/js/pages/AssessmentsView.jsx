import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import { Modal } from '../components/ui/Modal';
import {
    Calculator,
    CheckCircle2,
    Users,
    TrendingUp,
    Percent,
    Award,
    AlertCircle,
    Eye,
    Trash2,
    BookOpen,
    Layers,
} from 'lucide-react';

// + Core Entity 2: Assessment Scoring & DepEd Stats View (Teacher Protected)
export function AssessmentsView({ user }) {
    const isTeacher = user?.roles?.some((r) => r.name === 'teacher');

    const [assessments, setAssessments] = useState([]);
    const [refData, setRefData] = useState({
        grade_levels: [],
        school_years: [],
        terms: [],
        subjects: [],
        sections: [],
    });
    const [loading, setLoading] = useState(true);

    // + Form Encoding States
    const [schoolYearId, setSchoolYearId] = useState('');
    const [termId, setTermId] = useState('');
    const [gradeLevelId, setGradeLevelId] = useState('');
    const [sectionId, setSectionId] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [type, setType] = useState('quarterly');
    const [totalItems, setTotalItems] = useState(50);
    const [rawScoresInput, setRawScoresInput] = useState('45, 42, 38, 50, 32, 28, 48, 40, 35, 46');
    const [leastLearnedCompetency, setLeastLearnedCompetency] = useState('');
    const [remarks, setRemarks] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // + Modal View Details State
    const [selectedRecord, setSelectedRecord] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [assessmentsRes, refsRes, sectionsRes] = await Promise.all([
                api.get('/assessments'),
                api.get('/reference-data'),
                api.get('/sections'),
            ]);

            setAssessments(assessmentsRes.data || []);

            const combinedRefs = {
                ...refsRes,
                sections: sectionsRes.data || [],
            };
            setRefData(combinedRefs);

            // + Initialize Default Selectors
            if (combinedRefs.school_years?.[0]) setSchoolYearId(combinedRefs.school_years[0].id);
            if (combinedRefs.terms?.[0]) setTermId(combinedRefs.terms[0].id);
            if (combinedRefs.grade_levels?.[0]) setGradeLevelId(combinedRefs.grade_levels[0].id);
            if (combinedRefs.subjects?.[0]) setSubjectId(combinedRefs.subjects[0].id);
            if (combinedRefs.sections?.[0]) setSectionId(combinedRefs.sections[0].id);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    // + Filter sections based on selected Grade Level
    const availableSections = useMemo(() => {
        if (!gradeLevelId) return refData.sections;
        return refData.sections.filter((s) => Number(s.grade_level_id) === Number(gradeLevelId));
    }, [gradeLevelId, refData.sections]);

    useEffect(() => {
        if (availableSections.length > 0 && !availableSections.some((s) => s.id === Number(sectionId))) {
            setSectionId(availableSections[0].id);
        }
    }, [availableSections]);

    // + Parse raw scores string to array of numbers
    const parsedScores = useMemo(() => {
        return rawScoresInput
            .split(/[\s,]+/)
            .map((v) => Number(v.trim()))
            .filter((v) => !isNaN(v) && v >= 0);
    }, [rawScoresInput]);

    // + Client-Side Live DepEd Statistical Engine (Mirroring StatsCalculatorService)
    const liveStats = useMemo(() => {
        const n = parsedScores.length;
        if (n === 0 || totalItems <= 0) {
            return { n: 0, mean: 0, sd: 0, mps: 0, level: 'Pending', badgeVariant: 'default' };
        }

        const sum = parsedScores.reduce((acc, score) => acc + score, 0);
        const mean = sum / n;
        const mps = (mean / totalItems) * 100;

        const sumSquaredDiff = parsedScores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0);
        const sd = Math.sqrt(sumSquaredDiff / n);

        // + Official DepEd 7-Level Mastery Brackets
        let level = 'Absolutely No Mastery';
        let badgeVariant = 'noMastery';

        if (mps >= 96) {
            level = 'Mastered';
            badgeVariant = 'mastered';
        } else if (mps >= 86) {
            level = 'Closely Approximating Mastery';
            badgeVariant = 'closely';
        } else if (mps >= 66) {
            level = 'Moving Towards Mastery';
            badgeVariant = 'moving';
        } else if (mps >= 35) {
            level = 'Average';
            badgeVariant = 'average';
        } else if (mps >= 15) {
            level = 'Low';
            badgeVariant = 'low';
        } else if (mps >= 5) {
            level = 'Very Low';
            badgeVariant = 'veryLow';
        }

        return {
            n,
            mean: mean.toFixed(2),
            sd: sd.toFixed(2),
            mps: mps.toFixed(2),
            level,
            badgeVariant,
        };
    }, [parsedScores, totalItems]);

    async function handleSaveAssessment(e) {
        e.preventDefault();
        setSubmitting(true);
        setFormError('');
        setSuccessMessage('');

        if (parsedScores.length === 0) {
            setFormError('Please enter at least one score.');
            setSubmitting(false);
            return;
        }

        try {
            await api.post('/assessments', {
                school_year_id: Number(schoolYearId),
                term_id: Number(termId),
                grade_level_id: Number(gradeLevelId),
                section_id: Number(sectionId),
                subject_id: Number(subjectId),
                type,
                total_items: Number(totalItems),
                raw_scores: parsedScores,
                least_learned_competency: leastLearnedCompetency || 'Not specified',
                remarks: remarks || 'Complete',
            });

            setSuccessMessage('Assessment successfully saved with calculated DepEd statistics!');
            await loadData();
        } catch (err) {
            setFormError(err.message || 'Failed to save assessment.');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeleteAssessment(id) {
        if (!confirm('Are you sure you want to delete this assessment record?')) return;
        try {
            await api.delete(`/assessments/${id}`);
            await loadData();
        } catch (err) {
            alert(err.message || 'Failed to delete record.');
        }
    }

    return (
        <div className="space-y-8">
            {/* + Top Header */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-[#0071E3]" />
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                        DepEd Assessment Scoring & Analytics (Core Entity 2)
                    </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                    Encode scores to automatically compute Mean, Standard Deviation (SD), MPS, and DepEd Mastery Level.
                </p>
            </div>

            {/* + Main Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* + Left Column: Encoding Form (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-base font-bold text-slate-900">Score Encoding Sheet</h3>
                        <p className="text-xs text-slate-500">Configure class parameters and enter student raw scores.</p>
                    </div>

                    {formError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{formError}</span>
                        </div>
                    )}

                    {successMessage && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handleSaveAssessment} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Grade Level
                                </label>
                                <select
                                    value={gradeLevelId}
                                    onChange={(e) => setGradeLevelId(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#0071E3]"
                                >
                                    {refData.grade_levels?.map((gl) => (
                                        <option key={gl.id} value={gl.id}>{gl.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Section
                                </label>
                                <select
                                    value={sectionId}
                                    onChange={(e) => setSectionId(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#0071E3]"
                                >
                                    {availableSections.map((sec) => (
                                        <option key={sec.id} value={sec.id}>{sec.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Subject
                                </label>
                                <select
                                    value={subjectId}
                                    onChange={(e) => setSubjectId(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#0071E3]"
                                >
                                    {refData.subjects?.map((subj) => (
                                        <option key={subj.id} value={subj.id}>{subj.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Assessment Type
                                </label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#0071E3]"
                                >
                                    <option value="diagnostic">Diagnostic Assessment</option>
                                    <option value="formative">Formative Assessment</option>
                                    <option value="summative">Summative Assessment</option>
                                    <option value="quarterly">Quarterly Examination</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Total Items
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={totalItems}
                                    onChange={(e) => setTotalItems(Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#0071E3]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Quarter / Term
                                </label>
                                <select
                                    value={termId}
                                    onChange={(e) => setTermId(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#0071E3]"
                                >
                                    {refData.terms?.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Student Raw Scores (Comma-separated)
                            </label>
                            <textarea
                                rows="3"
                                required
                                value={rawScoresInput}
                                onChange={(e) => setRawScoresInput(e.target.value)}
                                placeholder="e.g. 45, 42, 38, 50, 32, 28, 48"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#0071E3]"
                            />
                            <p className="text-xs text-slate-400 mt-1">
                                Enrolled Scores: {parsedScores.length} students detected.
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Least Learned Competency
                            </label>
                            <input
                                type="text"
                                value={leastLearnedCompetency}
                                onChange={(e) => setLeastLearnedCompetency(e.target.value)}
                                placeholder="e.g. Solving Quadratic Equations using the formula"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#0071E3]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Teacher's Remarks / Action Plan
                            </label>
                            <input
                                type="text"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="e.g. Schedule intervention and remedial classes next week"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#0071E3]"
                            />
                        </div>

                        <Button type="submit" loading={submitting} className="w-full h-11 text-sm font-semibold">
                            Save Assessment & Store Analytics
                        </Button>
                    </form>
                </div>

                {/* + Right Column: Live Apple HIG DepEd Stats Preview (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-7 shadow-lg space-y-6">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                                    DepEd Real-Time Analytics
                                </span>
                                <h3 className="text-lg font-bold">Computed Statistics</h3>
                            </div>
                            <Award className="w-6 h-6 text-blue-400" />
                        </div>

                        {/* + Mastery Level Highlight Card */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col items-center justify-center text-center">
                            <span className="text-xs text-slate-300 uppercase tracking-wider">DepEd Mastery Bracket</span>
                            <div className="mt-2">
                                <Badge variant={liveStats.badgeVariant} size="md">
                                    {liveStats.level}
                                </Badge>
                            </div>
                        </div>

                        {/* + 4 Apple Metric Cards Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                <span className="text-xs text-slate-400 uppercase tracking-wider">Entries (N)</span>
                                <div className="text-2xl font-bold mt-1">{liveStats.n}</div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                <span className="text-xs text-slate-400 uppercase tracking-wider">Mean (X̄)</span>
                                <div className="text-2xl font-bold mt-1 text-emerald-400">{liveStats.mean}</div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                <span className="text-xs text-slate-400 uppercase tracking-wider">Pop. SD</span>
                                <div className="text-2xl font-bold mt-1 text-purple-400">{liveStats.sd}</div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                <span className="text-xs text-slate-400 uppercase tracking-wider">MPS (%)</span>
                                <div className="text-2xl font-bold mt-1 text-blue-400">{liveStats.mps}%</div>
                            </div>
                        </div>

                        <div className="text-xs text-slate-400 border-t border-white/10 pt-4 leading-relaxed">
                            Mean Percentage Score (MPS) determines whether an intervention plan is required under DepEd Order guidelines.
                        </div>
                    </div>
                </div>
            </div>

            {/* + Bottom Section: Previously Recorded Assessments Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Recorded Assessment History</h3>
                        <p className="text-xs text-slate-500">Historical mastery records and analytics logs.</p>
                    </div>
                    <Badge variant="default">{assessments.length} Records</Badge>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Section & Subject</th>
                                <th className="px-6 py-3 font-semibold">Type</th>
                                <th className="px-6 py-3 font-semibold">Takers</th>
                                <th className="px-6 py-3 font-semibold">Mean</th>
                                <th className="px-6 py-3 font-semibold">MPS</th>
                                <th className="px-6 py-3 font-semibold">Mastery Level</th>
                                <th className="px-6 py-3 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {assessments.length > 0 ? (
                                assessments.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900">
                                                {record.section?.name || 'Section'}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {record.subject?.name || 'Subject'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium uppercase text-slate-600">
                                            {record.type}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800">
                                            {record.no_of_entries || record.raw_scores?.length}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-900">
                                            {record.mean}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-[#0071E3]">
                                            {record.mps}%
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="mastered">
                                                {record.mastery_level || 'Evaluated'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedRecord(record)}
                                                    className="p-1.5 text-slate-400 hover:text-[#0071E3] hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View Scores & Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {isTeacher && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteAssessment(record.id)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Delete Assessment"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                        {loading ? 'Loading assessments...' : 'No assessment records recorded yet.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* + Modal: View Record Details & Raw Scores */}
            <Modal
                isOpen={!!selectedRecord}
                onClose={() => setSelectedRecord(null)}
                title="Assessment Record Details"
                description={`Assessment ID #${selectedRecord?.id} Analytics Summary`}
            >
                {selectedRecord && (
                    <div className="space-y-4 text-sm text-slate-700">
                        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl">
                            <div>
                                <span className="text-xs text-slate-500 uppercase font-semibold">Section</span>
                                <div className="font-bold text-slate-900">{selectedRecord.section?.name}</div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 uppercase font-semibold">Subject</span>
                                <div className="font-bold text-slate-900">{selectedRecord.subject?.name}</div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 uppercase font-semibold">Mean</span>
                                <div className="font-bold text-emerald-600">{selectedRecord.mean}</div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 uppercase font-semibold">MPS</span>
                                <div className="font-bold text-[#0071E3]">{selectedRecord.mps}%</div>
                            </div>
                        </div>

                        <div>
                            <span className="text-xs text-slate-500 uppercase font-semibold">Least Learned Competency</span>
                            <div className="mt-1 p-3 bg-slate-50 rounded-xl text-slate-800">
                                {selectedRecord.least_learned_competency || 'N/A'}
                            </div>
                        </div>

                        <div>
                            <span className="text-xs text-slate-500 uppercase font-semibold">Raw Scores Encoded</span>
                            <div className="mt-1 p-3 bg-slate-50 rounded-xl font-mono text-xs text-slate-700 break-all">
                                {selectedRecord.raw_scores?.join(', ')}
                            </div>
                        </div>

                        <div className="flex justify-end pt-3">
                            <Button variant="secondary" onClick={() => setSelectedRecord(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
