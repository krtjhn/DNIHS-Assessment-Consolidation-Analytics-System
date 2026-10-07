import React, { useState } from 'react';
import schoolLogo from '../../../logo.png';


/** Eye toggle icon for show/hide password */
const EyeIcon = ({ hidden }) => (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none">
        <path d="M2.8 12s3.3-5 9.2-5 9.2 5 9.2 5-3.3 5-9.2 5-9.2-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
        {hidden && <path d="m4 4 16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
    </svg>
);

export default function Login({ onLoginSuccess }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setNotice('');
        setLoading(true);

        const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
        const payload = isRegistering
            ? { name, email, password, password_confirmation: passwordConfirmation }
            : { email, password };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || (data.errors ? Object.values(data.errors)[0][0] : 'Authentication failed.'));
                return;
            }

            // Handle registration requiring admin approval
            if (isRegistering && data.requires_approval) {
                setIsRegistering(false);
                setNotice(data.message || 'Registration submitted! Please wait for Administrator approval before signing in.');
                setName('');
                setEmail('');
                setPassword('');
                setPasswordConfirmation('');
                return;
            }

            // Save to localStorage and notify App
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            onLoginSuccess(data.access_token, data.user);
        } catch {
            setError('Unable to establish connection to the server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative flex min-h-dvh flex-col items-center justify-center bg-[#f5f5f7] p-4 text-[#1d1d1f] antialiased sm:p-6 lg:p-8">
            <div className="w-full max-w-md">
                {/* School Seal & Branding */}
                <div className="flex flex-col items-center text-center mb-8">
                    <img
                        src={schoolLogo}
                        alt="Dayap National Integrated High School seal"
                        className="size-20 sm:size-24 object-contain mb-4 drop-shadow-2xs"
                    />
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                        Dayap National Integrated High School
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
                        Assessment Monitoring System
                    </p>
                </div>

                {/* Sign-In / Register Card */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                            {isRegistering ? 'Create Faculty Account' : 'Sign in with your account'}
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            {isRegistering
                                ? 'Register as a teacher to encode assessments and analytics'
                                : 'Enter your credentials to access the academic workspace'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {isRegistering && (
                            <div>
                                <label htmlFor="register-name" className="block text-xs font-medium text-slate-700 mb-1.5">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <input
                                        id="register-name"
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Maria Santos"
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition hover:border-slate-400 focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email Field */}
                        <div>
                            <label htmlFor="login-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                                Email address
                            </label>
                            <div className="relative">
                                <input
                                    id="login-email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="name@dayapnhs.edu.ph"
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition hover:border-slate-400 focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="login-password" className="block text-xs font-medium text-slate-700 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete={isRegistering ? 'new-password' : 'current-password'}
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition hover:border-slate-400 focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((visible) => !visible)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition hover:text-slate-700 focus-visible:outline-none focus-visible:text-[#0071e3]"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    <EyeIcon hidden={showPassword} />
                                </button>
                            </div>
                        </div>

                        {isRegistering && (
                            <div>
                                <label htmlFor="register-password-confirmation" className="block text-xs font-medium text-slate-700 mb-1.5">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="register-password-confirmation"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={passwordConfirmation}
                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition hover:border-slate-400 focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Registration Pending Notice */}
                        {notice && (
                            <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs font-medium text-emerald-800 leading-relaxed shadow-2xs">
                                <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-0.5">
                                    <svg className="size-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Registration Queued for Approval
                                </div>
                                {notice}
                            </div>
                        )}

                        {/* Error Banner */}
                        {error && (
                            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-[#0071e3] px-4 text-sm font-semibold text-white shadow-2xs transition hover:bg-[#0077ed] active:bg-[#0062c4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    <span>{isRegistering ? 'Registering…' : 'Signing in…'}</span>
                                </span>
                            ) : (
                                isRegistering ? 'Create Account' : 'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Mode Toggle Link */}
                    <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setError('');
                            }}
                            className="text-xs font-medium text-[#0071e3] hover:underline focus-visible:outline-none"
                        >
                            {isRegistering
                                ? 'Already have an institutional account? Sign In'
                                : 'New faculty member? Register as Teacher'}
                        </button>
                    </div>
                </div>

                <div className="mt-6 text-center text-xs text-slate-500">
                    Department of Education • Division of Laguna
                </div>
            </div>
        </main>
    );
}
