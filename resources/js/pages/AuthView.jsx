import React, { useState } from 'react';
import { api } from '../api';
import { Button } from '../components/ui/Button';
import { School, ShieldCheck, UserCheck, KeyRound, Mail, User } from 'lucide-react';

// + Apple HIG Authentication Card with Midterm Defense Presets
export function AuthView({ onLoginSuccess }) {
    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // + Midterm Defense One-Click Quick Fill Helper
    function handleQuickFill(role) {
        if (role === 'admin') {
            setEmail('admin@dayapnhs.edu.ph');
            setPassword('Admin@2024!');
            setMode('login');
        } else {
            setEmail('maria.santos@dayapnhs.edu.ph');
            setPassword('Teacher@2024!');
            setMode('login');
        }
        setErrorMessage('');
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setErrorMessage('');

        try {
            if (mode === 'login') {
                const res = await api.post('/auth/login', { email, password });
                api.setAuth(res.access_token, res.user);
                onLoginSuccess(res.user);
            } else {
                const res = await api.post('/auth/register', {
                    name,
                    email,
                    password,
                    password_confirmation: passwordConfirmation,
                });
                api.setAuth(res.access_token, res.user);
                onLoginSuccess(res.user);
            }
        } catch (err) {
            setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
            {/* + App Branding Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0071E3] to-blue-700 text-white shadow-md shadow-blue-500/20 mb-3">
                    <School className="w-7 h-7" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    Dayap NHS - Calauan Annex
                </h1>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                    Assessment Analytics & Statistical Mastery Management System
                </p>
            </div>

            {/* + Main Apple HIG Focused Auth Card */}
            <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xl shadow-slate-200/40">
                {/* + Apple Segmented Mode Switcher */}
                <div className="flex p-1 bg-slate-100 rounded-2xl mb-6">
                    <button
                        type="button"
                        onClick={() => {
                            setMode('login');
                            setErrorMessage('');
                        }}
                        className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-150 ${
                            mode === 'login'
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setMode('register');
                            setErrorMessage('');
                        }}
                        className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-150 ${
                            mode === 'register'
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        Register (Teacher)
                    </button>
                </div>

                {/* + Error Banner */}
                {errorMessage && (
                    <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                        {errorMessage}
                    </div>
                )}

                {/* + Auth Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'register' && (
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                            <div className="relative">
                                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Juan Dela Cruz"
                                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071E3] transition-all"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Institutional Email</label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@dayapnhs.edu.ph"
                                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071E3] transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                        <div className="relative">
                            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071E3] transition-all"
                            />
                        </div>
                    </div>

                    {mode === 'register' && (
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Confirm Password</label>
                            <div className="relative">
                                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                                <input
                                    type="password"
                                    required
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071E3] transition-all"
                                />
                            </div>
                        </div>
                    )}

                    <Button type="submit" loading={loading} className="w-full mt-2 h-11 text-sm font-semibold">
                        {mode === 'login' ? 'Sign In to Portal' : 'Create Teacher Account'}
                    </Button>
                </form>

                {/* + Midterm Defense Quick-Fill Buttons */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        ⚡ Midterm Defense 1-Click Fill
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                        <button
                            type="button"
                            onClick={() => handleQuickFill('admin')}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 rounded-xl transition-all cursor-pointer"
                        >
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            Admin Preset
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickFill('teacher')}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 rounded-xl transition-all cursor-pointer"
                        >
                            <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                            Teacher Preset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
