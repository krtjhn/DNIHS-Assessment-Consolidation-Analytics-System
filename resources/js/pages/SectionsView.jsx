import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Plus, Edit2, Trash2, Layers, Search, RefreshCw, AlertCircle } from 'lucide-react';

// + Core Entity 1: Sections Management CRUD View (Admin Protected)
export function SectionsView({ user }) {
    const isAdmin = user?.roles?.some((r) => r.name === 'system_admin');

    const [sections, setSections] = useState([]);
    const [refData, setRefData] = useState({ grade_levels: [], school_years: [] });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // + Modal Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState(null);
    const [deletingSection, setDeletingSection] = useState(null);

    const [formGradeLevelId, setFormGradeLevelId] = useState('');
    const [formSchoolYearId, setFormSchoolYearId] = useState('');
    const [formName, setFormName] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

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
            setRefData(refsRes || { grade_levels: [], school_years: [] });

            // + Set default form dropdown values
            if (refsRes?.grade_levels?.length && !formGradeLevelId) {
                setFormGradeLevelId(refsRes.grade_levels[0].id);
            }
            if (refsRes?.school_years?.length && !formSchoolYearId) {
                setFormSchoolYearId(refsRes.school_years[0].id);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function openCreateModal() {
        setEditingSection(null);
        setFormName('');
        setFormGradeLevelId(refData.grade_levels[0]?.id || '');
        setFormSchoolYearId(refData.school_years[0]?.id || '');
        setFormError('');
        setIsModalOpen(true);
    }

    function openEditModal(section) {
        setEditingSection(section);
        setFormName(section.name);
        setFormGradeLevelId(section.grade_level_id || refData.grade_levels[0]?.id);
        setFormSchoolYearId(section.school_year_id || refData.school_years[0]?.id);
        setFormError('');
        setIsModalOpen(true);
    }

    function openDeleteModal(section) {
        setDeletingSection(section);
        setIsDeleteModalOpen(true);
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');

        try {
            if (editingSection) {
                await api.put(`/sections/${editingSection.id}`, {
                    name: formName,
                    grade_level_id: Number(formGradeLevelId),
                    school_year_id: Number(formSchoolYearId),
                });
            } else {
                await api.post('/sections', {
                    name: formName,
                    grade_level_id: Number(formGradeLevelId),
                    school_year_id: Number(formSchoolYearId),
                });
            }
            setIsModalOpen(false);
            await loadData();
        } catch (err) {
            setFormError(err.message || 'Validation error occurred.');
        } finally {
            setFormLoading(false);
        }
    }

    async function handleDeleteConfirm() {
        if (!deletingSection) return;
        setFormLoading(true);
        try {
            await api.delete(`/sections/${deletingSection.id}`);
            setIsDeleteModalOpen(false);
            setDeletingSection(null);
            await loadData();
        } catch (err) {
            alert(err.message || 'Failed to delete section.');
        } finally {
            setFormLoading(false);
        }
    }

    const filteredSections = sections.filter((sec) =>
        sec.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sec.grade_level?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* + Top Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                <div>
                    <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-[#0071E3]" />
                        <h2 className="text-xl font-bold tracking-tight text-slate-900">
                            Sections Directory (Core Entity 1)
                        </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Manage academic sections across Grade 7 to 10 for Dayap NHS - Calauan Annex.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="secondary" size="md" onClick={loadData} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </Button>
                    {isAdmin && (
                        <Button variant="primary" size="md" onClick={openCreateModal}>
                            <Plus className="w-4 h-4" />
                            <span>Add New Section</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* + Search & Filters Bar */}
            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-xs">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sections by name or grade level..."
                    className="w-full text-sm bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
                />
            </div>

            {/* + Apple HIG Clean Grouped Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Grade Level</th>
                                <th className="px-6 py-4 font-semibold">Section Name</th>
                                <th className="px-6 py-4 font-semibold">School Year</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                {isAdmin && <th className="px-6 py-4 font-semibold text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {filteredSections.length > 0 ? (
                                filteredSections.map((sec) => (
                                    <tr key={sec.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {sec.grade_level?.name || `Grade ${sec.grade_level_id}`}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-900">
                                            {sec.name}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {sec.school_year?.year || '2025-2026'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={sec.is_active ? 'mastered' : 'default'}>
                                                {sec.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        {isAdmin && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(sec)}
                                                        className="p-1.5 text-slate-400 hover:text-[#0071E3] hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit Section"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openDeleteModal(sec)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Delete Section"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-slate-400">
                                        {loading ? 'Loading sections...' : 'No sections found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* + Modal: Create / Edit Section */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingSection ? 'Edit Section' : 'Create New Section'}
                description="Enter the details below. Section names must be unique within the same Grade Level and School Year."
            >
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    {formError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{formError}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Grade Level
                        </label>
                        <select
                            value={formGradeLevelId}
                            onChange={(e) => setFormGradeLevelId(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                        >
                            {refData.grade_levels?.map((gl) => (
                                <option key={gl.id} value={gl.id}>{gl.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            School Year
                        </label>
                        <select
                            value={formSchoolYearId}
                            onChange={(e) => setFormSchoolYearId(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                        >
                            {refData.school_years?.map((sy) => (
                                <option key={sy.id} value={sy.id}>{sy.year}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Section Name
                        </label>
                        <input
                            type="text"
                            required
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="e.g. Rizal, Mabini, Bonifacio"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={formLoading}>
                            {editingSection ? 'Save Changes' : 'Create Section'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* + Modal: Delete Confirmation */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Section?"
                description="Are you sure you want to remove this section? This action cannot be undone."
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-700">
                        You are about to delete <strong>{deletingSection?.name}</strong> (Grade {deletingSection?.grade_level_id}).
                    </p>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" loading={formLoading} onClick={handleDeleteConfirm}>
                            Confirm Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
