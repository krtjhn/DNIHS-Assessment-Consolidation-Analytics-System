import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../api';

/**
 * Helper: Generate 2-letter uppercase initials from full name
 */
function getTeacherInitials(name = '') {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('') || 'TC';
}

/**
 * Modal: Add / Provision New Faculty Member Directly by Admin
 */
function AddTeacherModal({ isOpen, onClose, form, onFormChange, onSubmit, saving, error }) {
    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-teacher-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
        >
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200/80 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#0071e3]/10 text-[#0071e3]">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="19" y1="8" x2="19" y2="14" />
                                <line x1="22" y1="11" x2="16" y2="11" />
                            </svg>
                        </div>
                        <div>
                            <h3 id="add-teacher-title" className="text-sm font-bold text-slate-900">
                                Add Faculty Member
                            </h3>
                            <p className="text-[11px] text-slate-500">
                                Provision teacher credentials with immediate active status.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition"
                    >
                        ✕
                    </button>
                </div>

                {error && (
                    <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                        {error}
                    </div>
                )}

                <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Maria Clara Santos"
                            value={form.name}
                            onChange={(e) => onFormChange({ ...form, name: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] shadow-2xs"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="email"
                            required
                            placeholder="e.g. maria.santos@dayapnhs.edu.ph"
                            value={form.email}
                            onChange={(e) => onFormChange({ ...form, email: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] shadow-2xs"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Initial Password <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="password"
                            required
                            minLength={8}
                            placeholder="Minimum 8 characters"
                            value={form.password}
                            onChange={(e) => onFormChange({ ...form, password: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] shadow-2xs"
                        />
                    </div>

                    <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 p-3 text-[11px] text-blue-800 leading-relaxed">
                        <strong>Institutional Note:</strong> This account will be automatically set to <strong>Approved</strong> and <strong>Active</strong>. The teacher can sign in immediately and be assigned classes in Class Assignments.
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
                            {saving ? 'Provisioning…' : 'Create Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/**
 * Modal: Revoke Teacher Access Safeguard Confirmation
 */
function RevokeAccessModal({ teacher, isOpen, onClose, onConfirm, saving }) {
    if (!isOpen || !teacher) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="revoke-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
        >
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200/80 animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5 text-sm font-bold text-rose-700 mb-2">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <span id="revoke-modal-title">Revoke Teacher Access?</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    <strong>{teacher.name}</strong> ({teacher.email}) will lose access to the system immediately. All existing student assessment records entered by this teacher will remain strictly preserved.
                </p>

                <div className="flex justify-end gap-2.5">
                    <button
                        type="button"
                        disabled={saving}
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98]"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={saving}
                        onClick={onConfirm}
                        className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-1.5 text-xs font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {saving ? 'Revoking…' : 'Revoke Access'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Modal: Reject Registration Applicant Confirmation
 */
function RejectApplicantModal({ teacher, isOpen, onClose, onConfirm, saving }) {
    if (!isOpen || !teacher) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
        >
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200/80 animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5 text-sm font-bold text-rose-700 mb-2">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <span id="reject-modal-title">Reject Registration Request?</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    Reject registration request for <strong>{teacher.name}</strong> ({teacher.email})? This user will not be permitted to sign into the system.
                </p>

                <div className="flex justify-end gap-2.5">
                    <button
                        type="button"
                        disabled={saving}
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98]"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={saving}
                        onClick={onConfirm}
                        className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-1.5 text-xs font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {saving ? 'Rejecting…' : 'Reject Request'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Main Standalone Component: TeacherAccounts
 */
export default function TeacherAccounts() {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'active' | 'removed'

    // Modals
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [teacherToRevoke, setTeacherToRevoke] = useState(null);
    const [teacherToReject, setTeacherToReject] = useState(null);
    const [modalError, setModalError] = useState('');

    // Add Form State
    const [addForm, setAddForm] = useState({
        name: '',
        email: '',
        password: '',
    });

    useEffect(() => {
        loadTeachers();
    }, []);

    // Auto-dismiss feedback notice
    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(null), 4500);
        return () => clearTimeout(timer);
    }, [notice]);

    async function loadTeachers() {
        setLoading(true);
        try {
            const res = await api.get('/teachers?include_inactive=1');
            setTeachers(res.data || []);
        } catch (err) {
            setNotice({ type: 'error', text: err.message || 'Failed to load faculty roster.' });
        } finally {
            setLoading(false);
        }
    }

    // Filtered lists
    const pendingCount = useMemo(() => {
        return teachers.filter((t) => t.approval_status === 'pending').length;
    }, [teachers]);

    const activeCount = useMemo(() => {
        return teachers.filter((t) => t.is_active && t.approval_status === 'approved').length;
    }, [teachers]);

    const removedCount = useMemo(() => {
        return teachers.filter((t) => !t.is_active || t.approval_status === 'rejected').length;
    }, [teachers]);

    const filteredTeachers = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return teachers
            .filter((t) => {
                if (statusFilter === 'pending') return t.approval_status === 'pending';
                if (statusFilter === 'active') return t.is_active && t.approval_status === 'approved';
                if (statusFilter === 'removed') return !t.is_active || t.approval_status === 'rejected';
                return true;
            })
            .filter((t) => {
                if (!query) return true;
                return (
                    t.name.toLowerCase().includes(query) ||
                    (t.email && t.email.toLowerCase().includes(query))
                );
            });
    }, [teachers, statusFilter, searchQuery]);

    // Action: Approve Registration
    async function handleApprove(teacher) {
        setSaving(true);
        try {
            const res = await api.patch(`/teachers/${teacher.id}/approve`, {});
            setNotice({ type: 'success', text: res.message || `Account for ${teacher.name} approved.` });
            await loadTeachers();
        } catch (err) {
            setNotice({ type: 'error', text: err.message || 'Failed to approve registration.' });
        } finally {
            setSaving(false);
        }
    }

    // Action: Reject Registration
    async function handleRejectConfirm() {
        if (!teacherToReject) return;
        setSaving(true);
        try {
            const res = await api.patch(`/teachers/${teacherToReject.id}/reject`, {});
            setNotice({ type: 'success', text: res.message || `Registration for ${teacherToReject.name} rejected.` });
            setTeacherToReject(null);
            await loadTeachers();
        } catch (err) {
            setNotice({ type: 'error', text: err.message || 'Failed to reject registration.' });
        } finally {
            setSaving(false);
        }
    }

    // Action: Restore Access
    async function handleRestore(teacher) {
        setSaving(true);
        try {
            const res = await api.patch(`/teachers/${teacher.id}/reactivate`, {});
            setNotice({ type: 'success', text: res.message || `Access restored for ${teacher.name}.` });
            await loadTeachers();
        } catch (err) {
            setNotice({ type: 'error', text: err.message || 'Failed to restore access.' });
        } finally {
            setSaving(false);
        }
    }

    // Action: Revoke Access
    async function handleRevokeConfirm() {
        if (!teacherToRevoke) return;
        setSaving(true);
        try {
            const res = await api.delete(`/teachers/${teacherToRevoke.id}`);
            setNotice({ type: 'success', text: res.message || `Access revoked for ${teacherToRevoke.name}.` });
            setTeacherToRevoke(null);
            await loadTeachers();
        } catch (err) {
            setNotice({ type: 'error', text: err.message || 'Failed to revoke access.' });
        } finally {
            setSaving(false);
        }
    }

    // Action: Direct Provisioning
    async function handleCreateTeacher(e) {
        e.preventDefault();
        setModalError('');
        setSaving(true);

        try {
            const res = await api.post('/teachers', addForm);
            setNotice({ type: 'success', text: res.message || 'Faculty member created successfully.' });
            setAddForm({ name: '', email: '', password: '' });
            setIsAddOpen(false);
            await loadTeachers();
        } catch (err) {
            setModalError(err.message || 'Failed to provision faculty account.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="flex flex-col gap-5 w-full">
            {/* Feedback Notice Toast */}
            {notice && (
                <div
                    role="alert"
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-xs font-semibold shadow-2xs transition ${
                        notice.type === 'error'
                            ? 'border-rose-200 bg-rose-50 text-rose-900'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {notice.type === 'error' ? (
                            <svg className="size-4 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
                                <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        ) : (
                            <svg className="size-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        <span>{notice.text}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setNotice(null)}
                        className="text-slate-400 hover:text-slate-600"
                        aria-label="Dismiss notice"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Main Content Card: Filter Bar + Faculty Roster Table */}
            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden flex flex-col">
                {/* Control Bar: Status Segments + Live Search + Add Button */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-4">
                    {/* Status Segments */}
                    <div role="tablist" aria-label="Faculty status filter" className="inline-flex rounded-xl bg-slate-200/60 p-1 text-xs">
                        <button
                            type="button"
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                                statusFilter === 'all'
                                    ? 'bg-white text-slate-900 shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            All ({teachers.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => setStatusFilter('pending')}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition-all relative flex items-center gap-1.5 ${
                                statusFilter === 'pending'
                                    ? 'bg-white text-amber-900 shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <span>Pending</span>
                            <span className={`inline-flex items-center justify-center size-4 rounded-full text-[10px] font-bold ${
                                pendingCount > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-200 text-slate-600'
                            }`}>
                                {pendingCount}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setStatusFilter('active')}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                                statusFilter === 'active'
                                    ? 'bg-white text-emerald-900 shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Active ({activeCount})
                        </button>

                        <button
                            type="button"
                            onClick={() => setStatusFilter('removed')}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                                statusFilter === 'removed'
                                    ? 'bg-white text-slate-900 shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Removed ({removedCount})
                        </button>
                    </div>

                    {/* Live Search Input & Add Action */}
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search faculty name or email…"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] shadow-2xs"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setModalError('');
                                setIsAddOpen(true);
                            }}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0071e3] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#0077ed] active:bg-[#0062c4] active:scale-[0.98] transition cursor-pointer"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="19" y1="8" x2="19" y2="14" />
                                <line x1="22" y1="11" x2="16" y2="11" />
                            </svg>
                            <span>+ Add Faculty</span>
                        </button>
                    </div>
                </div>

                {/* Faculty Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-2">
                            <svg className="animate-spin h-6 w-6 text-[#0071e3]" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <span className="text-xs">Loading faculty accounts…</span>
                        </div>
                    ) : (
                        <table className="w-full border-collapse text-left text-xs">
                            <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                                <tr>
                                    <th className="py-3.5 px-4">Faculty Member</th>
                                    <th className="py-3.5 px-4">Email Address</th>
                                    <th className="py-3.5 px-4 text-center">Active Classes</th>
                                    <th className="py-3.5 px-4">Account Status</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredTeachers.length > 0 ? (
                                    filteredTeachers.map((teacher) => {
                                        const initials = getTeacherInitials(teacher.name);
                                        const isPending = teacher.approval_status === 'pending';
                                        const isRejected = teacher.approval_status === 'rejected';
                                        const isActive = teacher.is_active && teacher.approval_status === 'approved';

                                        return (
                                            <tr key={teacher.id} className="hover:bg-slate-50/60 transition-colors">
                                                {/* Faculty Member Name & Avatar */}
                                                <td className="py-3 px-4 font-semibold text-slate-900">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200/80 shadow-2xs">
                                                            {initials}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 text-xs">
                                                                {teacher.name}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 font-medium">
                                                                Registered: {teacher.created_at ? new Date(teacher.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Email Address */}
                                                <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                                                    {teacher.email}
                                                </td>

                                                {/* Active Loads Count */}
                                                <td className="py-3 px-4 text-center">
                                                    {isActive ? (
                                                        <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#0071e3] border border-blue-200/70">
                                                            {teacher.active_loads_count || 0} {teacher.active_loads_count === 1 ? 'Class' : 'Classes'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>

                                                {/* Status Badge */}
                                                <td className="py-3 px-4">
                                                    {isPending ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200">
                                                            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                            Pending Approval
                                                        </span>
                                                    ) : isActive ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                                                            <span className="size-1.5 rounded-full bg-emerald-500" />
                                                            Active
                                                        </span>
                                                    ) : isRejected ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100/80 px-2.5 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-200">
                                                            Rejected
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200/80">
                                                            Removed
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Action Buttons */}
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {isPending ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    disabled={saving}
                                                                    onClick={() => handleApprove(teacher)}
                                                                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1 text-xs font-semibold text-white shadow-2xs transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={saving}
                                                                    onClick={() => setTeacherToReject(teacher)}
                                                                    className="rounded-xl border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </>
                                                        ) : isActive ? (
                                                            <button
                                                                type="button"
                                                                disabled={saving}
                                                                onClick={() => setTeacherToRevoke(teacher)}
                                                                className="rounded-xl border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition active:scale-[0.98] shadow-2xs cursor-pointer"
                                                            >
                                                                Remove Access
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                disabled={saving}
                                                                onClick={() => handleRestore(teacher)}
                                                                className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition active:scale-[0.98] shadow-2xs cursor-pointer"
                                                            >
                                                                Restore Access
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                                            {searchQuery
                                                ? 'No faculty members match your search criteria.'
                                                : statusFilter === 'pending'
                                                ? 'No pending registration requests to review.'
                                                : 'No faculty accounts found.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modals */}
            <AddTeacherModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                form={addForm}
                onFormChange={setAddForm}
                onSubmit={handleCreateTeacher}
                saving={saving}
                error={modalError}
            />

            <RevokeAccessModal
                teacher={teacherToRevoke}
                isOpen={Boolean(teacherToRevoke)}
                onClose={() => setTeacherToRevoke(null)}
                onConfirm={handleRevokeConfirm}
                saving={saving}
            />

            <RejectApplicantModal
                teacher={teacherToReject}
                isOpen={Boolean(teacherToReject)}
                onClose={() => setTeacherToReject(null)}
                onConfirm={handleRejectConfirm}
                saving={saving}
            />
        </div>
    );
}
