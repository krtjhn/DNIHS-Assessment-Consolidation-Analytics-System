import React, { useState, useEffect } from 'react';
import { api } from './api';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Login from './pages/auth/Login';
import SectionList from './pages/admin/system/SectionList';
import RecordEntry from './pages/teacher/RecordEntry';
import PerformanceReport from './pages/reports/PerformanceReport';
import SchoolCalendar from './pages/admin/system/SchoolCalendar';
import TeacherAssignment from './pages/admin/TeacherAssignment';
import TeacherAccounts from './pages/admin/system/TeacherAccounts';

/**
 * @file App.jsx
 * @description Master Application Shell matching Dayap NIHS Capstone Architecture.
 * Coordinates authentication state, responsive sidebar layout, and role-based module routing.
 */
export default function App() {
    // 1. Authentication State
    const [token, setToken] = useState(() => localStorage.getItem('token') || '');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 2. Navigation & Layout State
    const [activeTab, setActiveTab] = useState('records');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // 3. Academic Period Reference State
    const [activeSY, setActiveSY] = useState(null);
    const [activeTerm, setActiveTerm] = useState(null);

    // On mount or token change, verify user session
    useEffect(() => {
        checkSession();

        function handleUnauthorized() {
            handleLogout();
        }

        function handlePeriodUpdated() {
            loadAcademicPeriod();
        }

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        window.addEventListener('academic-period:updated', handlePeriodUpdated);

        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
            window.removeEventListener('academic-period:updated', handlePeriodUpdated);
        };
    }, []);

    async function checkSession() {
        const storedToken = api.getToken();
        if (!storedToken) {
            setLoading(false);
            return;
        }

        try {
            const res = await api.get('/auth/me');
            setUser(res.user);
            setToken(storedToken);

            const isAdmin = res.user?.roles?.some((r) => r.name === 'system_admin');
            setActiveTab(isAdmin ? 'sections' : 'records');

            // Load reference data for TopBar active SY badge
            loadAcademicPeriod();
        } catch {
            api.clearAuth();
            setUser(null);
            setToken('');
        } finally {
            setLoading(false);
        }
    }

    async function loadAcademicPeriod() {
        try {
            const refs = await api.get('/reference-data');
            const activeYear = refs.active_sy || refs.school_years?.[0] || null;
            setActiveSY(activeYear);
            if (activeYear?.terms) {
                const term = activeYear.terms.find((t) => t.status === 'active') || activeYear.terms[0];
                setActiveTerm(term);
            }
        } catch {
            // Fail gracefully if reference data cannot be fetched
        }
    }

    function handleLoginSuccess(newToken, loggedInUser) {
        setToken(newToken);
        setUser(loggedInUser);
        const isAdmin = loggedInUser?.roles?.some((r) => r.name === 'system_admin');
        setActiveTab(isAdmin ? 'sections' : 'records');
        loadAcademicPeriod();
    }

    async function handleLogout() {
        try {
            await api.post('/auth/logout', {});
        } catch {
            // Invalidate token locally even if server response fails
        } finally {
            api.clearAuth();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken('');
            setUser(null);
        }
    }

    // Full screen loading indicator while session is validating
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
                <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin h-8 w-8 text-[#0071e3]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
                        Loading portal…
                    </span>
                </div>
            </div>
        );
    }

    // Unauthenticated state: Institutional Login Portal
    if (!user || !token) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    const isAdmin = Boolean(user.roles?.some((r) => r.name === 'system_admin'));
    const activeSYName = activeSY?.name || '2025–2026';
    const activeTermName = activeTerm?.name || (activeSY?.terms?.find((t) => t.status === 'active')?.name) || 'First Term';

    return (
        <div className="min-h-screen bg-[#f5f5f7] text-slate-900 font-sans antialiased selection:bg-[#0071e3] selection:text-white">
            {/* Global Left Navigation Sidebar */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isAdmin={isAdmin}
                user={user}
                onLogout={handleLogout}
                isCollapsed={isCollapsed}
                isMobileOpen={isMobileOpen}
                onCloseMobile={() => setIsMobileOpen(false)}
            />

            {/* Main Application Container with responsive padding matching sidebar width */}
            <div
                className={`min-h-screen flex flex-col transition-all duration-300 ${
                    isCollapsed ? 'md:pl-[72px]' : 'md:pl-64'
                }`}
            >
                {/* Institutional TopBar with SY status and Profile Chip */}
                <TopBar
                    user={user}
                    activeTab={activeTab}
                    activeSYName={activeSYName}
                    activeTermName={activeTermName}
                    onToggleSidebar={() => setIsCollapsed((prev) => !prev)}
                    onOpenMobileSidebar={() => setIsMobileOpen(true)}
                />

                {/* Main Dynamic Workspace Area */}
                <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1520px] w-full mx-auto">
                    {activeTab === 'records' && (
                        !isAdmin ? (
                            <RecordEntry user={user} />
                        ) : (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-xs font-semibold text-amber-800">
                                Assessment Record Entry is restricted to Teachers.
                            </div>
                        )
                    )}
                    {activeTab === 'consolidation' && <PerformanceReport />}
                    {activeTab === 'sections' && (
                        isAdmin ? (
                            <SectionList />
                        ) : (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-xs font-semibold text-amber-800">
                                Section Management is restricted to System Administrators.
                            </div>
                        )
                    )}
                    {activeTab === 'assignments' && (
                        isAdmin ? (
                            <TeacherAssignment />
                        ) : (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-xs font-semibold text-amber-800">
                                Class Assignments are restricted to System Administrators.
                            </div>
                        )
                    )}
                    {activeTab === 'calendar' && (
                        isAdmin ? (
                            <SchoolCalendar />
                        ) : (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-xs font-semibold text-amber-800">
                                School Calendar is restricted to System Administrators.
                            </div>
                        )
                    )}
                    {activeTab === 'teachers' && (
                        isAdmin ? (
                            <TeacherAccounts />
                        ) : (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-xs font-semibold text-amber-800">
                                Teacher Accounts are restricted to System Administrators.
                            </div>
                        )
                    )}
                </main>

                {/* Institutional DepEd Footer */}
                <footer className="border-t border-slate-200/80 bg-white/60 py-4 px-6 text-center text-xs text-slate-500 backdrop-blur-xs">
                    <p className="font-medium">
                        Dayap National Integrated High School &bull; Assessment Monitoring System &bull; BSIT Capstone Midterm Defense
                    </p>
                </footer>
            </div>
        </div>
    );
}
