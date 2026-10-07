import React, { useState, useEffect } from 'react';
import { api } from './api';
import { Navbar } from './components/Navbar';
import { AuthView } from './pages/AuthView';
import { SectionsView } from './pages/SectionsView';
import { AssessmentsView } from './pages/AssessmentsView';

// + Apple HIG Root Application Orchestrator
export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('assessments');

    useEffect(() => {
        checkSession();

        function handleUnauthorized() {
            setUser(null);
        }

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, []);

    async function checkSession() {
        const token = api.getToken();
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await api.get('/auth/me');
            setUser(res.user);

            // + If Admin, default to sections tab
            const isAdmin = res.user?.roles?.some((r) => r.name === 'system_admin');
            if (isAdmin) {
                setActiveTab('sections');
            } else {
                setActiveTab('assessments');
            }
        } catch {
            api.clearAuth();
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    async function handleLogout() {
        try {
            await api.post('/auth/logout', {});
        } catch {
            // Ignore error on logout
        } finally {
            api.clearAuth();
            setUser(null);
        }
    }

    // + Loading Screen
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
                <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin h-8 w-8 text-[#0071E3]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span className="text-xs font-medium text-slate-500 tracking-wider uppercase">
                        Loading portal...
                    </span>
                </div>
            </div>
        );
    }

    // + Unauthenticated State
    if (!user) {
        return <AuthView onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
    }

    // + Authenticated Dashboard State
    return (
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
            <Navbar
                user={user}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onLogout={handleLogout}
            />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'sections' && <SectionsView user={user} />}
                {activeTab === 'assessments' && <AssessmentsView user={user} />}
            </main>

            <footer className="py-6 border-t border-slate-200/60 text-center text-xs text-slate-400">
                Dayap National High School - Calauan Annex &bull; BSIT Capstone Midterm Defense &bull; 2026
            </footer>
        </div>
    );
}
