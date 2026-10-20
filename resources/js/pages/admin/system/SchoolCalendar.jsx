import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../../api';
import LoadingIndicator from '../../../components/LoadingIndicator';
import Modal from '../../../components/Modal';

// Term card component displaying term details and status controls
function TermCard({ term, saving, onUpdateStatus }) {
    const isActiveTerm = term.status === 'active';
    const isCompleted = term.status === 'completed';
    const isPending = term.status === 'pending';

    return (
        <div
            className={`rounded-2xl border p-4 flex flex-col justify-between gap-3.5 transition-all shadow-2xs ${
                isActiveTerm
                    ? 'border-emerald-300 bg-emerald-50/50 shadow-xs'
                    : isCompleted
                    ? 'border-emerald-200/80 bg-emerald-50/20'
                    : 'border-slate-200/80 bg-slate-50/50'
            }`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Term {term.term_number}
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {term.name}
                    </div>
                </div>
                {isActiveTerm ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active (Open)
                    </span>
                ) : isCompleted ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        Completed
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Pending
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-slate-200/60">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700">Status:</span>
                    <select
                        disabled={saving}
                        value={term.status}
                        onChange={(e) => onUpdateStatus(term.id, e.target.value)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] transition cursor-pointer shadow-2xs ${
                            isActiveTerm
                                ? 'border-emerald-300 bg-white text-emerald-900'
                                : isCompleted
                                ? 'border-emerald-200 bg-white text-emerald-800'
                                : 'border-slate-200 bg-white text-slate-700'
                        }`}
                    >
                        <option value="pending">Pending (Upcoming / Locked)</option>
                        <option value="active">Active (Open for Encoding)</option>
                        <option value="completed">Completed (Closed / Read-Only)</option>
                    </select>
                </div>
                <div className="text-[11px] text-slate-500 leading-normal">
                    {isActiveTerm && 'Teachers can encode and update examination scores.'}
                    {isPending && 'Upcoming: Teachers cannot encode scores yet.'}
                    {isCompleted && 'Closed: Grading finished; view-only mode for teachers.'}
                </div>
            </div>
        </div>
    );
}

// School year table row with activation and delete actions
function SchoolYearRow({ schoolYear, saving, onActivate, onDelete }) {
    const displayName = schoolYear.name?.startsWith('SY') ? schoolYear.name : `SY ${schoolYear.name}`;

    return (
        <tr className="hover:bg-slate-50/70 transition-colors">
            <td className="py-3 px-4 font-bold text-slate-900 text-xs">
                {displayName}
            </td>
            <td className="py-3 px-4 text-slate-600 text-xs tabular-nums">
                {schoolYear.start_date?.slice(0, 10) || '—'}
            </td>
            <td className="py-3 px-4 text-slate-600 text-xs tabular-nums">
                {schoolYear.end_date?.slice(0, 10) || '—'}
            </td>
            <td className="py-3 px-4">
                {schoolYear.is_active ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                    </span>
                ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200/60">
                        Inactive
                    </span>
                )}
            </td>
            <td className="py-3 px-4 text-right">
                {!schoolYear.is_active && (
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => onActivate(schoolYear)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all active:scale-[0.98] shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
                        >
                            Set as Active
                        </button>
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => onDelete(schoolYear)}
                            className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-all active:scale-[0.98] shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                        >
                            Delete
                        </button>
                    </div>
                )}
            </td>
        </tr>
    );
}

// Modal for provisioning a new school year
function AddSchoolYearModal({ isOpen, onClose, form, onFormChange, onSubmit, saving, error }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New School Year">
            {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="sy-name-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                            School Year Name
                        </label>
                        <input
                            id="sy-name-input"
                            required
                            value={form.name}
                            onChange={(e) => onFormChange({ ...form, name: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] shadow-2xs"
                            placeholder="e.g. 2026-2027"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="sy-start-date" className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Start Date
                            </label>
                            <input
                                id="sy-start-date"
                                required
                                type="date"
                                value={form.start_date}
                                onChange={(e) => onFormChange({ ...form, start_date: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] shadow-2xs"
                            />
                        </div>
                        <div>
                            <label htmlFor="sy-end-date" className="block text-xs font-semibold text-slate-700 mb-1.5">
                                End Date
                            </label>
                            <input
                                id="sy-end-date"
                                required
                                type="date"
                                value={form.end_date}
                                onChange={(e) => onFormChange({ ...form, end_date: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] shadow-2xs"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 pt-1 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) => onFormChange({ ...form, is_active: e.target.checked })}
                            className="rounded border-slate-300 text-[#0071e3] focus:ring-[#0071e3]"
                        />
                        Set as currently active school year
                    </label>

                    <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-xl bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] px-4 py-2 text-xs font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
                        >
                            {saving ? (
                                <span className="inline-flex items-center gap-1.5">
                                    <LoadingIndicator type="dot-circle" size="xs" className="text-white" />
                                    <span>Creating…</span>
                                </span>
                            ) : (
                                'Create School Year'
                            )}
                        </button>
                    </div>
                </form>
        </Modal>
    );
}

// Main School Calendar module managing terms and school years
export default function SchoolCalendar() {
    const [schoolYears, setSchoolYears] = useState([]);
    const [selectedSchoolYearId, setSelectedSchoolYearId] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState(null);
    const [modalError, setModalError] = useState('');
    const [isAddSYOpen, setIsAddSYOpen] = useState(false);

    const [schoolYearForm, setSchoolYearForm] = useState({
        name: '',
        start_date: '',
        end_date: '',
        is_active: false,
    });

    useEffect(() => {
        loadSchoolYears();
    }, []);

    async function loadSchoolYears() {
        setLoading(true);
        try {
            const res = await api.get('/school-years');
            const list = res.data || [];
            setSchoolYears(list);

            if (list.length > 0 && !selectedSchoolYearId) {
                const active = list.find((s) => s.is_active) || list[0];
                setSelectedSchoolYearId(String(active.id));
            }
        } catch {
            // Fail gracefully if school years cannot be fetched
        } finally {
            setLoading(false);
        }
    }

    const sortedSchoolYears = useMemo(() => {
        return [...schoolYears].sort((a, b) => {
            const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
            const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
            if (dateB !== dateA) return dateB - dateA;
            return String(b.name || '').localeCompare(String(a.name || ''));
        });
    }, [schoolYears]);

    const activeSchoolYear = useMemo(() => {
        return schoolYears.find((s) => s.is_active) || null;
    }, [schoolYears]);

    const selectedSchoolYear = useMemo(() => {
        return schoolYears.find((s) => String(s.id) === String(selectedSchoolYearId)) || sortedSchoolYears[0] || null;
    }, [schoolYears, selectedSchoolYearId, sortedSchoolYears]);

    const sortedTerms = useMemo(() => {
        return [...(selectedSchoolYear?.terms || [])].sort((a, b) => a.term_number - b.term_number);
    }, [selectedSchoolYear?.terms]);

    async function handleUpdateTermStatus(termId, newStatus) {
        setSaving(true);
        setNotice(null);
        try {
            await api.patch(`/terms/${termId}/status`, { status: newStatus });
            setNotice({ type: 'success', text: `Term status updated to ${newStatus}.` });
            await loadSchoolYears();
            window.dispatchEvent(new CustomEvent('academic-period:updated'));
        } catch (err) {
            setNotice({ type: 'error', text: err.message || 'Failed to update term status.' });
        } finally {
            setSaving(false);
        }
    }

    async function handleActivateSchoolYear(sy) {
        const displayName = sy.name?.startsWith('SY') ? sy.name : `SY ${sy.name}`;
        setSaving(true);
        setNotice(null);
        try {
            await api.put(`/school-years/${sy.id}`, {
                name: sy.name,
                start_date: sy.start_date?.slice(0, 10),
                end_date: sy.end_date?.slice(0, 10),
                is_active: true,
            });
            setNotice({ type: 'success', text: `${displayName} is now the active school year.` });
            setSelectedSchoolYearId(String(sy.id));
            await loadSchoolYears();
            window.dispatchEvent(new CustomEvent('academic-period:updated'));
        } catch (err) {
            setNotice({ type: 'error', text: err.message || 'Failed to activate school year.' });
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteSchoolYear(sy) {
        const displayName = sy.name?.startsWith('SY') ? sy.name : `SY ${sy.name}`;
        if (!confirm(`Are you sure you want to delete ${displayName}?`)) return;
        setSaving(true);
        setNotice(null);
        try {
            await api.delete(`/school-years/${sy.id}`);
            setNotice({ type: 'success', text: `${displayName} was deleted successfully.` });
            await loadSchoolYears();
        } catch (err) {
            setNotice({ type: 'error', text: err.message || 'Failed to delete school year.' });
        } finally {
            setSaving(false);
        }
    }

    async function handleCreateSchoolYear(e) {
        e.preventDefault();
        setSaving(true);
        setModalError('');
        try {
            await api.post('/school-years', schoolYearForm);
            setIsAddSYOpen(false);
            setSchoolYearForm({ name: '', start_date: '', end_date: '', is_active: false });
            setNotice({ type: 'success', text: 'School year and constituent terms created successfully.' });
            await loadSchoolYears();
        } catch (err) {
            setModalError(err.message || 'Failed to create school year.');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <LoadingIndicator type="dot-circle" size="md" label="Loading..." />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            {
                // Status feedback notification banner
            }
            <AnimatePresence>
                {notice && (
                    <motion.div
                        key={notice.text}
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className={`rounded-xl border p-3 text-xs font-semibold ${
                            notice.type === 'success'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : 'border-red-200 bg-red-50 text-red-700'
                        }`}
                    >
                        {notice.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {
                // Active academic terms status overview (1st, 2nd, 3rd Terms)
            }
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Current School Year Terms:
                        </span>
                        <span className="rounded-full bg-[#0071e3]/10 px-2.5 py-0.5 text-xs font-bold text-[#0071e3] border border-[#0071e3]/20">
                            {activeSchoolYear?.name ? (activeSchoolYear.name.startsWith('SY') ? activeSchoolYear.name : `SY ${activeSchoolYear.name}`) : 'None'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500 font-medium">Viewing Terms For:</span>
                        <select
                            value={selectedSchoolYearId}
                            onChange={(e) => setSelectedSchoolYearId(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
                        >
                            {sortedSchoolYears.map((sy) => {
                                const label = sy.name?.startsWith('SY') ? sy.name : `SY ${sy.name}`;
                                return (
                                    <option key={sy.id} value={sy.id}>
                                        {label} {sy.is_active ? '(Active)' : ''}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-3">
                    {sortedTerms.map((term) => (
                        <TermCard
                            key={term.id}
                            term={term}
                            saving={saving}
                            onUpdateStatus={handleUpdateTermStatus}
                        />
                    ))}
                </div>
            </div>

            {
                // School years roster and creation trigger
            }
            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        All School Years ({sortedSchoolYears.length})
                    </h3>
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                            setModalError('');
                            setIsAddSYOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
                    >
                        <span>+ Add School Year</span>
                    </motion.button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                        <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                            <tr>
                                <th className="py-3 px-4">School Year</th>
                                <th className="py-3 px-4">Start Date</th>
                                <th className="py-3 px-4">End Date</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {sortedSchoolYears.map((sy) => (
                                <SchoolYearRow
                                    key={sy.id}
                                    schoolYear={sy}
                                    saving={saving}
                                    onActivate={handleActivateSchoolYear}
                                    onDelete={handleDeleteSchoolYear}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {
                // Create School Year modal dialog
            }
            <AddSchoolYearModal
                isOpen={isAddSYOpen}
                onClose={() => setIsAddSYOpen(false)}
                form={schoolYearForm}
                onFormChange={setSchoolYearForm}
                onSubmit={handleCreateSchoolYear}
                saving={saving}
                error={modalError}
            />
        </div>
    );
}
