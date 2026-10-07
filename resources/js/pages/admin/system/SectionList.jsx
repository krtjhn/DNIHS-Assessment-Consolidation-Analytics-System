import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../api';

function SectionTableRow({ section, grade, saving, onToggleArchive, onDelete }) {
    return (
        <tr className="hover:bg-slate-50/70 transition-colors">
            <td className="py-3 px-4 font-semibold text-slate-700">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200/80">
                    {grade?.display_name || grade?.name || (grade?.level ? `Grade ${grade.level}` : (section.grade_level?.display_name || `Grade ${section.grade_level_id}`))}
                </span>
            </td>
            <td className="py-3 px-4 font-bold text-slate-900 text-xs">
                {section.name}
            </td>
            <td className="py-3 px-4">
                <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                        section.is_active
                            ? 'bg-emerald-100/80 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200/80'
                    }`}
                >
                    {section.is_active ? 'Active' : 'Archived'}
                </span>
            </td>
            <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        disabled={saving}
                        onClick={() => onToggleArchive(section)}
                        className={`rounded-xl border px-3 py-1 text-xs font-semibold transition-all active:scale-[0.98] shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] ${
                            section.is_active
                                ? 'border-amber-200 bg-white text-amber-700 hover:bg-amber-50'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        {section.is_active ? 'Archive' : 'Restore'}
                    </button>
                    <button
                        type="button"
                        disabled={saving}
                        onClick={() => onDelete(section)}
                        className="rounded-xl border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all active:scale-[0.98] shadow-2xs"
                    >
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    );
}

function AddSectionModal({ isOpen, onClose, form, onFormChange, onSubmit, schoolYears = [], gradeLevels = [], saving, error }) {
    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-section-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
        >
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200/80 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                    <h3 id="add-section-title" className="text-base font-bold text-slate-900">Add New Section</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
                    >
                        ✕
                    </button>
                </div>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="sec-sy-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                            School Year
                        </label>
                        <select
                            id="sec-sy-select"
                            required
                            value={form.school_year_id}
                            onChange={(e) => onFormChange({ ...form, school_year_id: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] shadow-2xs"
                        >
                            {schoolYears.map((sy) => (
                                <option key={sy.id} value={sy.id}>
                                    SY {sy.year || sy.name} {sy.is_active ? '(Active)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="sec-grade-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Grade Level
                        </label>
                        <select
                            id="sec-grade-select"
                            required
                            value={form.grade_level_id}
                            onChange={(e) => onFormChange({ ...form, grade_level_id: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] shadow-2xs"
                        >
                            {gradeLevels.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.display_name || g.name || `Grade ${g.level}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="sec-name-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Section Name
                        </label>
                        <input
                            id="sec-name-input"
                            type="text"
                            required
                            placeholder="e.g. Rizal, Bonifacio, Mabini"
                            value={form.name}
                            onChange={(e) => onFormChange({ ...form, name: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] shadow-2xs"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-xl bg-[#0071e3] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0077ed] transition-all active:scale-[0.98] shadow-2xs disabled:opacity-50"
                        >
                            {saving ? 'Creating…' : 'Create Section'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function SectionList() {
    const [sections, setSections] = useState([]);
    const [schoolYears, setSchoolYears] = useState([]);
    const [gradeLevels, setGradeLevels] = useState([]);
    const [selectedSYId, setSelectedSYId] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [modalError, setModalError] = useState('');

    const [addForm, setAddForm] = useState({
        name: '',
        grade_level_id: '',
        school_year_id: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [sectionsRes, refsRes] = await Promise.all([
                api.get('/sections'),
                api.get('/reference-data'),
            ]);

            setSections(sectionsRes.data || []);
            setSchoolYears(refsRes.school_years || []);
            setGradeLevels(refsRes.grade_levels || []);

            const activeSY = refsRes.school_years?.find((s) => s.is_active) || refsRes.school_years?.[0];
            if (activeSY) {
                setSelectedSYId(String(activeSY.id));
                setAddForm((prev) => ({
                    ...prev,
                    school_year_id: String(activeSY.id),
                    grade_level_id: String(refsRes.grade_levels?.[0]?.id || '1'),
                }));
            }
        } catch (err) {
            console.error('Failed to load sections data:', err);
        } finally {
            setLoading(false);
        }
    }

    const filteredSections = useMemo(() => {
        if (!selectedSYId) return sections;
        return sections.filter((s) => String(s.school_year_id) === String(selectedSYId));
    }, [sections, selectedSYId]);

    async function handleToggleArchive(section) {
        setSaving(true);
        try {
            await api.put(`/sections/${section.id}`, {
                name: section.name,
                grade_level_id: section.grade_level_id,
                school_year_id: section.school_year_id,
                is_active: !section.is_active,
            });
            await loadData();
        } catch (err) {
            alert(err.message || 'Failed to update section status.');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(section) {
        if (!confirm(`Are you sure you want to delete "${section.name}"?`)) return;
        setSaving(true);
        try {
            await api.delete(`/sections/${section.id}`);
            await loadData();
        } catch (err) {
            alert(err.message || 'Failed to delete section.');
        } finally {
            setSaving(false);
        }
    }

    async function handleCreateSection(e) {
        e.preventDefault();
        setSaving(true);
        setModalError('');

        try {
            await api.post('/sections', {
                name: addForm.name,
                grade_level_id: Number(addForm.grade_level_id),
                school_year_id: Number(addForm.school_year_id),
            });
            setIsAddModalOpen(false);
            setAddForm((prev) => ({ ...prev, name: '' }));
            await loadData();
        } catch (err) {
            setModalError(err.message || 'Failed to create section.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Sections Table Card with integrated controls */}
            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        All Sections ({filteredSections.length})
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <label htmlFor="sy-filter" className="text-xs font-semibold text-slate-600">SY:</label>
                            <select
                                id="sy-filter"
                                value={selectedSYId}
                                onChange={(e) => setSelectedSYId(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
                            >
                                {schoolYears.map((sy) => (
                                    <option key={sy.id} value={sy.id}>
                                        SY {sy.year || sy.name} {sy.is_active ? '(Active)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setModalError('');
                                setIsAddModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0071e3] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#0077ed] transition-all active:scale-[0.98] cursor-pointer"
                        >
                            <span>+ Add Section</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                <th className="py-3 px-4">Grade Level</th>
                                <th className="py-3 px-4">Section Name</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {filteredSections.length > 0 ? (
                                filteredSections.map((sec) => {
                                    const grade = sec.grade_level || gradeLevels.find((g) => g.id === sec.grade_level_id);
                                    return (
                                        <SectionTableRow
                                            key={sec.id}
                                            section={sec}
                                            grade={grade}
                                            saving={saving}
                                            onToggleArchive={handleToggleArchive}
                                            onDelete={handleDelete}
                                        />
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="4" className="py-12 text-center text-slate-400">
                                        {loading ? 'Loading sections…' : 'No sections found for this school year.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Section Modal */}
            <AddSectionModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                form={addForm}
                onFormChange={setAddForm}
                onSubmit={handleCreateSection}
                schoolYears={schoolYears}
                gradeLevels={gradeLevels}
                saving={saving}
                error={modalError}
            />
        </div>
    );
}
