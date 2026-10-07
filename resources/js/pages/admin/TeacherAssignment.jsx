import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../api';

/**
 * Subcomponent: Teacher List Sidebar
 */
function TeacherListSidebar({
    searchQuery,
    setSearchQuery,
    filteredTeachers,
    selectedTeacherId,
    setSelectedTeacherId,
    assignments,
    selectedSYId,
}) {
    // Pre-index teacher assignment counts for active school year
    const teacherLoadsMap = useMemo(() => {
        const counts = new Map();
        for (const a of assignments) {
            if (String(a.school_year_id) === String(selectedSYId)) {
                counts.set(a.user_id, (counts.get(a.user_id) || 0) + 1);
            }
        }
        return counts;
    }, [assignments, selectedSYId]);

    return (
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden flex flex-col">
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/70">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search faculty members…"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-2xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
                />
            </div>

            <div className="max-h-[580px] overflow-y-auto divide-y divide-slate-100">
                {filteredTeachers.length > 0 ? (
                    filteredTeachers.map((teacher) => {
                        const loadCount = teacherLoadsMap.get(teacher.id) || 0;
                        const isSelected = selectedTeacherId === teacher.id;

                        const initials = (teacher.name || 'T')
                            .split(' ')
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((p) => p[0])
                            .join('')
                            .toUpperCase();

                        return (
                            <button
                                key={teacher.id}
                                type="button"
                                onClick={() => setSelectedTeacherId(teacher.id)}
                                className={`w-full text-left p-3.5 transition-all flex items-center justify-between gap-3 cursor-pointer focus-visible:outline-none ${
                                    isSelected
                                        ? 'bg-[#0071e3]/10 border-l-4 border-l-[#0071e3]'
                                        : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                        className={`size-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                                            isSelected
                                                ? 'bg-[#0071e3] text-white shadow-2xs'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        {initials}
                                    </div>
                                    <div className="min-w-0">
                                        <div className={`text-xs truncate ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-800 font-medium'}`}>
                                            {teacher.name}
                                        </div>
                                        <div className="text-[11px] text-slate-500 truncate">
                                            {teacher.email || 'No email provided'}
                                        </div>
                                    </div>
                                </div>
                                <span
                                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 border ${
                                        loadCount > 0
                                            ? 'bg-emerald-100/80 text-emerald-800 border-emerald-200'
                                            : 'bg-slate-100 text-slate-500 border-slate-200/80'
                                    }`}
                                >
                                    {loadCount} {loadCount === 1 ? 'Class' : 'Classes'}
                                </span>
                            </button>
                        );
                    })
                ) : (
                    <div className="p-8 text-center text-xs text-slate-400">
                        No faculty members found.
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Subcomponent: Add Class Assignment Form
 */
function AddClassForm({
    teacher,
    addGradeId,
    setAddGradeId,
    addSectionId,
    setAddSectionId,
    addSubjectId,
    setAddSubjectId,
    gradeLevels,
    availableSections,
    availableSubjects,
    currentConflict,
    actionLoading,
    onSubmit,
}) {
    return (
        <div className="p-4 border-b border-slate-100 bg-white">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2.5">
                Assign Class to {teacher.name}
            </h4>
            <form onSubmit={onSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Grade Level */}
                    <div>
                        <label htmlFor="grade-select" className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Grade Level
                        </label>
                        <select
                            id="grade-select"
                            required
                            value={addGradeId}
                            onChange={(e) => {
                                setAddGradeId(e.target.value);
                                setAddSectionId('');
                                setAddSubjectId('');
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
                        >
                            <option value="">Select Grade</option>
                            {gradeLevels.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.display_name || g.name || `Grade ${g.level}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Section */}
                    <div>
                        <label htmlFor="section-select" className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Section
                        </label>
                        <select
                            id="section-select"
                            required
                            disabled={!addGradeId}
                            value={addSectionId}
                            onChange={(e) => setAddSectionId(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] disabled:bg-slate-50 disabled:text-slate-400"
                        >
                            <option value="">{addGradeId ? 'Select Section' : 'Select Grade First'}</option>
                            {availableSections.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Subject */}
                    <div>
                        <label htmlFor="subject-select" className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Subject
                        </label>
                        <select
                            id="subject-select"
                            required
                            disabled={!addGradeId}
                            value={addSubjectId}
                            onChange={(e) => setAddSubjectId(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] disabled:bg-slate-50 disabled:text-slate-400"
                        >
                            <option value="">{addGradeId ? 'Select Subject' : 'Select Grade First'}</option>
                            {availableSubjects.map((subj) => (
                                <option key={subj.id} value={subj.id}>
                                    {subj.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Conflict / Re-assignment Banner */}
                {currentConflict && currentConflict.user_id !== teacher.id && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 font-medium">
                        ⚠️ <strong>Notice:</strong> This class is currently handled by{' '}
                        <span className="font-bold underline">{currentConflict.teacher?.name || 'another teacher'}</span>.
                        Assigning it to {teacher.name} will transfer the class load.
                    </div>
                )}

                <div className="flex justify-end pt-1">
                    <button
                        type="submit"
                        disabled={actionLoading || !addSectionId || !addSubjectId}
                        className="rounded-xl bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
                    >
                        {actionLoading ? 'Assigning…' : '+ Assign Class'}
                    </button>
                </div>
            </form>
        </div>
    );
}

/**
 * Subcomponent: Teaching Schedule Table
 */
function TeachingScheduleTable({
    teacherAssignments,
    actionLoading,
    onRemoveAssignment,
}) {
    return (
        <div className="p-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
                Active Teaching Schedule ({teacherAssignments.length})
            </h4>
            {teacherAssignments.length > 0 ? (
                <div className="rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
                    <table className="w-full border-collapse text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                            <tr>
                                <th className="py-2.5 px-3.5">Grade Level</th>
                                <th className="py-2.5 px-3.5">Section</th>
                                <th className="py-2.5 px-3.5">Subject</th>
                                <th className="py-2.5 px-3.5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {teacherAssignments.map((a) => (
                                <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="py-2.5 px-3.5 font-bold text-slate-800">
                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
                                            {a.section?.grade_level?.display_name || a.section?.grade_level?.name || 'Grade'}
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                                        {a.section?.name || '—'}
                                    </td>
                                    <td className="py-2.5 px-3.5 font-bold text-[#0071e3]">
                                        {a.subject?.name || '—'}
                                    </td>
                                    <td className="py-2.5 px-3.5 text-right">
                                        <button
                                            type="button"
                                            onClick={() => onRemoveAssignment(a.id)}
                                            disabled={actionLoading}
                                            className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition-all active:scale-[0.98] disabled:opacity-50 shadow-2xs"
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                    No classes assigned for this teacher yet. Use the form above to allocate a load.
                </div>
            )}
        </div>
    );
}

/**
 * Master Controller: Teacher Class Assignment Matrix
 */
export default function TeacherAssignment() {
    const [schoolYears, setSchoolYears] = useState([]);
    const [selectedSYId, setSelectedSYId] = useState('');
    const [gradeLevels, setGradeLevels] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [sections, setSections] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [assignments, setAssignments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedTeacherId, setSelectedTeacherId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Add Class Form State
    const [addGradeId, setAddGradeId] = useState('');
    const [addSectionId, setAddSectionId] = useState('');
    const [addSubjectId, setAddSubjectId] = useState('');

    // Notifications
    const [notice, setNotice] = useState(null);

    // Initial Data Fetch
    useEffect(() => {
        loadInitialData();
    }, []);

    async function loadInitialData() {
        setLoading(true);
        try {
            const [refsRes, sectionsRes, teachersRes] = await Promise.all([
                api.get('/reference-data'),
                api.get('/sections'),
                api.get('/teachers'),
            ]);

            const syList = refsRes.school_years || [];
            setSchoolYears(syList);
            setGradeLevels(refsRes.grade_levels || []);
            setSubjects(refsRes.subjects || []);
            setSections(sectionsRes.data || []);

            const teacherList = teachersRes.data || [];
            setTeachers(teacherList);

            const activeSY = refsRes.active_sy || syList.find((s) => s.is_active) || syList[0];
            if (activeSY) {
                const syId = String(activeSY.id);
                setSelectedSYId(syId);
                await fetchAssignments(syId);
            }
        } catch (err) {
            console.error('Failed to load initial data:', err);
            setNotice({ type: 'error', text: 'Failed to load assignment reference data.' });
        } finally {
            setLoading(false);
        }
    }

    async function fetchAssignments(syId) {
        if (!syId) return;
        try {
            const res = await api.get(`/teaching-assignments?school_year_id=${syId}`);
            setAssignments(res.data || []);
        } catch (err) {
            console.error('Error fetching assignments:', err);
            setNotice({ type: 'error', text: 'Failed to fetch teaching assignments.' });
        }
    }

    // When selected school year changes
    async function handleSYChange(newSYId) {
        setSelectedSYId(newSYId);
        setAddGradeId('');
        setAddSectionId('');
        setAddSubjectId('');
        setLoading(true);
        try {
            await fetchAssignments(newSYId);
        } finally {
            setLoading(false);
        }
    }

    // Filter teachers list by search query
    const filteredTeachers = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return teachers;
        return teachers.filter(
            (t) =>
                t.name?.toLowerCase().includes(query) ||
                t.email?.toLowerCase().includes(query)
        );
    }, [teachers, searchQuery]);

    // Keep selected teacher valid
    useEffect(() => {
        if (teachers.length === 0) {
            setSelectedTeacherId(null);
            return;
        }
        if (!selectedTeacherId || !teachers.some((t) => t.id === selectedTeacherId)) {
            setSelectedTeacherId(filteredTeachers[0]?.id || teachers[0]?.id);
        }
    }, [teachers, filteredTeachers, selectedTeacherId]);

    const selectedTeacher = useMemo(
        () => teachers.find((t) => t.id === selectedTeacherId) || null,
        [teachers, selectedTeacherId]
    );

    // Selected teacher's assignments for the active SY
    const teacherAssignments = useMemo(() => {
        if (!selectedTeacher) return [];
        return assignments.filter(
            (a) => a.user_id === selectedTeacher.id && String(a.school_year_id) === String(selectedSYId)
        );
    }, [assignments, selectedTeacher, selectedSYId]);

    // Available sections for chosen grade & school year
    const availableSections = useMemo(() => {
        if (!addGradeId) return [];
        return sections
            .filter((s) => String(s.school_year_id) === String(selectedSYId) && String(s.grade_level_id) === String(addGradeId))
            .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    }, [sections, selectedSYId, addGradeId]);

    // Available subjects for chosen grade
    const availableSubjects = useMemo(() => {
        if (!addGradeId) return [];
        return subjects.filter((s) => String(s.grade_level_id) === String(addGradeId));
    }, [subjects, addGradeId]);

    // Check if class is already assigned to someone
    const currentConflict = useMemo(() => {
        if (!addSectionId || !addSubjectId) return null;
        return assignments.find(
            (a) =>
                String(a.section_id) === String(addSectionId) &&
                String(a.subject_id) === String(addSubjectId) &&
                String(a.school_year_id) === String(selectedSYId)
        );
    }, [assignments, addSectionId, addSubjectId, selectedSYId]);

    // Assign Class handler
    async function handleAssignClass(e) {
        e.preventDefault();
        if (!selectedTeacher || !addSectionId || !addSubjectId) return;

        if (currentConflict?.user_id === selectedTeacher.id) {
            setNotice({ type: 'error', text: 'This class is already assigned to this faculty member.' });
            return;
        }

        setActionLoading(true);
        setNotice(null);

        try {
            await api.post('/teaching-assignments', {
                user_id: selectedTeacher.id,
                school_year_id: Number(selectedSYId),
                section_id: Number(addSectionId),
                subject_id: Number(addSubjectId),
                effective_from: new Date().toISOString().slice(0, 10),
            });

            setNotice({ type: 'success', text: `Class successfully assigned to ${selectedTeacher.name}.` });
            setAddSectionId('');
            setAddSubjectId('');
            await fetchAssignments(selectedSYId);
        } catch (err) {
            setNotice({ type: 'error', text: err.message || 'Failed to assign class.' });
        } finally {
            setActionLoading(false);
        }
    }

    // Remove Assignment handler
    async function handleRemoveAssignment(assignmentId) {
        if (!confirm('Are you sure you want to remove this class assignment?')) return;

        setActionLoading(true);
        setNotice(null);

        try {
            await api.delete(`/teaching-assignments/${assignmentId}`);
            setNotice({ type: 'success', text: 'Class assignment removed successfully.' });
            await fetchAssignments(selectedSYId);
        } catch (err) {
            setNotice({ type: 'error', text: err.message || 'Failed to remove teaching assignment.' });
        } finally {
            setActionLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <div className="size-6 animate-spin rounded-full border-2 border-[#0071e3] border-t-transparent mb-2" />
                <span className="text-xs font-medium">Loading faculty matrix…</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Top Toolbar: SY Selector & Refresh */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs">
                <div className="text-xs font-semibold text-slate-500">
                    Teaching load allocation across grade levels and sections
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label htmlFor="sy-matrix-select" className="text-xs font-semibold text-slate-600">SY:</label>
                        <select
                            id="sy-matrix-select"
                            value={selectedSYId}
                            onChange={(e) => handleSYChange(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
                        >
                            {schoolYears.map((sy) => {
                                const label = sy.name?.startsWith('SY') ? sy.name : `SY ${sy.name}`;
                                return (
                                    <option key={sy.id} value={sy.id}>
                                        {label} {sy.is_active ? '(Active)' : ''}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={() => fetchAssignments(selectedSYId)}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] cursor-pointer"
                    >
                        <span>↻ Refresh</span>
                    </button>
                </div>
            </div>

            {/* Flash Notice */}
            {notice && (
                <div
                    className={`flex items-center justify-between rounded-xl border p-3.5 text-xs font-semibold transition-all ${
                        notice.type === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                >
                    <span>{notice.text}</span>
                    <button
                        type="button"
                        onClick={() => setNotice(null)}
                        className="p-1 rounded hover:opacity-75 focus-visible:outline-none"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Two-Pane Workspace Grid */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 items-start">
                {/* Left Pane: Faculty List */}
                <TeacherListSidebar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    filteredTeachers={filteredTeachers}
                    selectedTeacherId={selectedTeacherId}
                    setSelectedTeacherId={setSelectedTeacherId}
                    assignments={assignments}
                    selectedSYId={selectedSYId}
                />

                {/* Right Pane: Selected Teacher's Workload Sheet */}
                <div className="lg:col-span-8 rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden flex flex-col">
                    {selectedTeacher ? (
                        <>
                            {/* Teacher Profile Banner */}
                            <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center font-bold text-sm shadow-2xs">
                                        {selectedTeacher.name?.slice(0, 2).toUpperCase() || 'T'}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">
                                            {selectedTeacher.name}
                                        </h3>
                                        <div className="text-xs text-slate-500">
                                            {selectedTeacher.email || 'No email provided'} &bull; Faculty Member
                                        </div>
                                    </div>
                                </div>
                                <span className="rounded-full bg-[#0071e3]/10 px-3 py-1 text-xs font-bold text-[#0071e3] border border-[#0071e3]/20">
                                    {teacherAssignments.length} Assigned {teacherAssignments.length === 1 ? 'Class' : 'Classes'}
                                </span>
                            </div>

                            {/* Add Class Form */}
                            <AddClassForm
                                teacher={selectedTeacher}
                                addGradeId={addGradeId}
                                setAddGradeId={setAddGradeId}
                                addSectionId={addSectionId}
                                setAddSectionId={setAddSectionId}
                                addSubjectId={addSubjectId}
                                setAddSubjectId={setAddSubjectId}
                                gradeLevels={gradeLevels}
                                availableSections={availableSections}
                                availableSubjects={availableSubjects}
                                currentConflict={currentConflict}
                                actionLoading={actionLoading}
                                onSubmit={handleAssignClass}
                            />

                            {/* Assigned Classes Table */}
                            <TeachingScheduleTable
                                teacherAssignments={teacherAssignments}
                                actionLoading={actionLoading}
                                onRemoveAssignment={handleRemoveAssignment}
                            />
                        </>
                    ) : (
                        <div className="p-12 text-center text-xs text-slate-400">
                            Select a faculty member from the left panel to manage class assignments.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
