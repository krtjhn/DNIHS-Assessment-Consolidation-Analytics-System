import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
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
import LoadingIndicator from './components/LoadingIndicator';

// Tab pane wrapper that animates cleanly when activated without unmounting or losing memory state
function AnimatedTabPane({ isActive, children }) {
    return (
        <div className={isActive ? 'block' : 'hidden'}>
            <motion.div
                initial={false}
                animate={isActive ? { opacity: [0.35, 1], y: [6, 0] } : {}}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
                {children}
            </motion.div>
        </div>
    );
}

// Resolve the authorized active tab according to user RBAC role
function resolveAuthorizedTab(requestedTab, isAdmin) {
    const adminTabs = ['consolidation', 'sections', 'assignments', 'calendar', 'teachers'];
    const teacherTabs = ['records'];

    if (isAdmin) {
        return adminTabs.includes(requestedTab) ? requestedTab : 'consolidation';
    }
    // Teachers are strictly restricted to Record Entry
    return teacherTabs.includes(requestedTab) ? requestedTab : 'records';
}

// Master Application Shell coordinating auth state, sidebar layout, and module routing
export default function App() {
    // 1. Authentication State
    const [token, setToken] = useState(() => localStorage.getItem('token') || '');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 2. Navigation & Layout State (Pure state persisted in localStorage with zero hashtags)
    const [activeTab, setActiveTabState] = useState(() => {
        const saved = localStorage.getItem('activeTab');
        return saved || 'records';
    });

    // Track mounted tabs so tabs stay alive in memory (instant 0ms switching without refetching)
    const [visitedTabs, setVisitedTabs] = useState(() => new Set([activeTab]));

    const setActiveTab = (tab) => {
        const isAdmin = Boolean(user?.roles?.some((r) => r.name === 'system_admin'));
        const validTab = resolveAuthorizedTab(tab, isAdmin);
        setActiveTabState(validTab);
        setVisitedTabs((prev) => {
            if (prev.has(validTab)) return prev;
            const updated = new Set(prev);
            updated.add(validTab);
            return updated;
        });
        localStorage.setItem('activeTab', validTab);
    };

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // 3. Academic Period Reference State
    const [activeSY, setActiveSY] = useState(null);
    const [activeTerm, setActiveTerm] = useState(null);

    const isLoggingOutRef = useRef(false);

    // Completely clear local session state and reset client routing
    function performLocalLogout() {
        api.clearAuth();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('activeTab');

        // Strip legacy hashtag if present
        if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
        }

        setToken('');
        setUser(null);
        setVisitedTabs(new Set());
    }

    // On mount, strip any legacy URL hashtag and verify user session
    useEffect(() => {
        // Strip legacy URL hashtag if present in browser address bar
        if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
        }

        checkSession();

        // When receiving unauthorized status, only perform local state cleanup
        // (Do NOT invoke backend logout to prevent recursive 401 dispatch cascades)
        function handleUnauthorized() {
            performLocalLogout();
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
            const saved = localStorage.getItem('activeTab');
            const validTab = resolveAuthorizedTab(saved, isAdmin);

            setActiveTabState(validTab);
            setVisitedTabs(new Set([validTab]));
            localStorage.setItem('activeTab', validTab);

            // Load reference data for TopBar active SY badge
            loadAcademicPeriod();
        } catch {
            performLocalLogout();
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
        const saved = localStorage.getItem('activeTab');
        const validTab = resolveAuthorizedTab(saved, isAdmin);
        setActiveTabState(validTab);
        setVisitedTabs(new Set([validTab]));
        localStorage.setItem('activeTab', validTab);

        // Ensure URL stays completely clean without any hashtags
        if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
        }

        loadAcademicPeriod();
    }

    async function handleLogout() {
        if (isLoggingOutRef.current) return;
        isLoggingOutRef.current = true;

        const currentToken = api.getToken();

        // 1. Immediately reset client state so components unmount cleanly
        performLocalLogout();

        // 2. Best-effort server token revocation with captured token
        if (currentToken) {
            try {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${currentToken}`,
                    },
                    body: JSON.stringify({}),
                });
            } catch {
                // Ignore any network/server failure during background token revocation
            }
        }

        isLoggingOutRef.current = false;
    }

    // Full screen loading indicator while session is validating
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
                <LoadingIndicator type="dot-circle" size="lg" label="Loading..." />
            </div>
        );
    }

    // Unauthenticated state: Institutional Login Portal
    if (!user || !token) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    const isAdmin = Boolean(user.roles?.some((r) => r.name === 'system_admin'));
    const activeSYName = activeSY?.name || '2025–2026';
    const activeTermName = activeTerm?.name || (activeSY?.terms?.find((t) => t.status === 'active')?.name) || '1st Term';

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-[#0071e3] selection:text-white">
            {
                // Institutional left navigation sidebar
            }
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isAdmin={isAdmin}
                onLogout={handleLogout}
                isCollapsed={isCollapsed}
                onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
                isMobileOpen={isMobileOpen}
                onCloseMobile={() => setIsMobileOpen(false)}
            />

            {
                // Responsive main shell adapting to collapsed/expanded sidebar widths
            }
            <div
                className={`min-h-screen flex flex-col transition-all duration-300 ${
                    isCollapsed ? 'md:pl-[72px]' : 'md:pl-72'
                }`}
            >
                {
                    // Header bar displaying active academic calendar and current user
                }
                <TopBar
                    user={user}
                    activeTab={activeTab}
                    activeSYName={activeSYName}
                    activeTermName={activeTermName}
                    onOpenMobileSidebar={() => setIsMobileOpen(true)}
                />

                {
                    // Main view container retaining mounted state across visited tabs
                }
                <main className="flex-1 w-full px-3 sm:px-5 md:px-6 py-4">
                    {
                        // Teacher Workspace: Assessment record entry and qualitative scoring
                    }
                    {!isAdmin && visitedTabs.has('records') && (
                        <AnimatedTabPane isActive={activeTab === 'records'}>
                            <RecordEntry user={user} />
                        </AnimatedTabPane>
                    )}

                    {
                        // Admin Workspace: Consolidated school-wide and sectional reports
                    }
                    {isAdmin && visitedTabs.has('consolidation') && (
                        <AnimatedTabPane isActive={activeTab === 'consolidation'}>
                            <PerformanceReport />
                        </AnimatedTabPane>
                    )}

                    {
                        // Admin Workspace: Section management and academic rosters
                    }
                    {isAdmin && visitedTabs.has('sections') && (
                        <AnimatedTabPane isActive={activeTab === 'sections'}>
                            <SectionList />
                        </AnimatedTabPane>
                    )}

                    {
                        // Admin Workspace: Teaching assignments and class allocation
                    }
                    {isAdmin && visitedTabs.has('assignments') && (
                        <AnimatedTabPane isActive={activeTab === 'assignments'}>
                            <TeacherAssignment />
                        </AnimatedTabPane>
                    )}

                    {
                        // Admin Workspace: School calendar and academic period management
                    }
                    {isAdmin && visitedTabs.has('calendar') && (
                        <AnimatedTabPane isActive={activeTab === 'calendar'}>
                            <SchoolCalendar />
                        </AnimatedTabPane>
                    )}

                    {
                        // Admin Workspace: Teacher account management and credentials
                    }
                    {isAdmin && visitedTabs.has('teachers') && (
                        <AnimatedTabPane isActive={activeTab === 'teachers'}>
                            <TeacherAccounts />
                        </AnimatedTabPane>
                    )}
                </main>
            </div>
        </div>
    );
}
