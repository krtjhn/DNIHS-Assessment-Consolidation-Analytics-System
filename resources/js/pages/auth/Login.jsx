import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';
import schoolLogo from '../../../logo.png';
import LoadingIndicator from '../../components/LoadingIndicator';
import { api } from '../../api';

export default function Login({ onLoginSuccess }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    // Ensure absolutely no scrollbars are produced by the body/window while in auth screen
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setNotice('');

        setLoading(true);

        const endpoint = isRegistering ? '/auth/register' : '/auth/login';
        const payload = isRegistering
            ? { name, email, password, password_confirmation: passwordConfirmation }
            : { email, password };

        try {
            const data = await api.post(endpoint, payload);

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

            // Save active session and notify parent shell
            api.setAuth(data.access_token, data.user);
            onLoginSuccess(data.access_token, data.user);
        } catch (err) {
            setError(err.message || 'Unable to establish connection to the server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="fixed inset-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex items-center justify-center bg-[#f5f5f7] p-3 sm:p-4 text-[#1d1d1f] antialiased">
            <div className="w-full max-w-[380px] sm:max-w-[400px] my-auto flex flex-col items-center">
                {/* School Seal & Branding */}
                <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                    className="flex flex-col items-center text-center mb-2.5 sm:mb-3"
                >
                    <motion.img
                        src={schoolLogo}
                        alt="Dayap National Integrated High School seal"
                        className="size-13 sm:size-14 object-contain mb-1 drop-shadow-2xs"
                        whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
                        transition={{ duration: 0.3 }}
                    />
                    <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
                        Dayap National Integrated High School
                    </h1>
                    <p className="mt-0.5 text-[11px] sm:text-xs font-medium text-slate-500">
                        Assessment Consolidation & Analytics System
                    </p>
                </motion.div>

                {/* Sign-In / Register Card */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs"
                >
                    <motion.div
                        key={isRegistering ? 'reg-header' : 'login-header'}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mb-2.5 sm:mb-3"
                    >
                        <h2 className="text-sm sm:text-base font-semibold tracking-tight text-slate-900">
                            {isRegistering ? 'Create Faculty Account' : 'Sign in with your account'}
                        </h2>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                            {isRegistering
                                ? 'Register as a teacher to encode assessments and analytics'
                                : 'Enter your credentials to access the academic workspace'}
                        </p>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:gap-2.5">
                        <AnimatePresence initial={false}>
                            {isRegistering && (
                                <motion.div
                                    key="reg-name-field"
                                    initial={{ opacity: 0, height: 0, y: -4 }}
                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                    exit={{ opacity: 0, height: 0, y: -4 }}
                                    transition={{ duration: 0.2, ease: 'easeOut' }}
                                    className="overflow-hidden"
                                >
                                    <label htmlFor="register-name" className="block text-[11px] font-medium text-slate-700 mb-1">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="register-name"
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. Maria C. Santos, LPT"
                                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition hover:border-slate-400 focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Email Field */}
                        <div>
                            <label htmlFor="login-email" className="block text-[11px] font-medium text-slate-700 mb-1">
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
                                    placeholder="juandelacruz@gmail.com"
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition hover:border-slate-400 focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="login-password" className="block text-[11px] font-medium text-slate-700 mb-1">
                                Password
                            </label>
                            <div className="relative flex items-center">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete={isRegistering ? 'new-password' : 'current-password'}
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder={isRegistering ? 'Create password (min. 8 chars)' : 'Enter your account password'}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 sm:py-2 pr-9 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition hover:border-slate-400 focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                                />
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.92 }}
                                    onClick={() => setShowPassword((visible) => !visible)}
                                    className="absolute right-1.5 flex size-6.5 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/40"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.span
                                            key={showPassword ? 'pw-visible' : 'pw-hidden'}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.15 }}
                                            className="flex items-center justify-center"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="size-3.5 sm:size-4" strokeWidth={1.9} />
                                            ) : (
                                                <Eye className="size-3.5 sm:size-4" strokeWidth={1.9} />
                                            )}
                                        </motion.span>
                                    </AnimatePresence>
                                </motion.button>
                            </div>
                        </div>

                        <AnimatePresence initial={false}>
                            {isRegistering && (
                                <motion.div
                                    key="reg-confirm-field"
                                    initial={{ opacity: 0, height: 0, y: -4 }}
                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                    exit={{ opacity: 0, height: 0, y: -4 }}
                                    transition={{ duration: 0.2, ease: 'easeOut' }}
                                    className="overflow-hidden"
                                >
                                    <label htmlFor="register-password-confirmation" className="block text-[11px] font-medium text-slate-700 mb-1">
                                        Confirm Password
                                    </label>
                                    <div className="relative flex items-center">
                                        <input
                                            id="register-password-confirmation"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            required
                                            value={passwordConfirmation}
                                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                                            placeholder="Re-enter password to confirm"
                                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 sm:py-2 pr-9 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition hover:border-slate-400 focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                                        />
                                        <motion.button
                                            type="button"
                                            whileHover={{ scale: 1.08 }}
                                            whileTap={{ scale: 0.92 }}
                                            onClick={() => setShowConfirmPassword((visible) => !visible)}
                                            className="absolute right-1.5 flex size-6.5 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/40"
                                            aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                                            title={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                                        >
                                            <AnimatePresence mode="wait" initial={false}>
                                                <motion.span
                                                    key={showConfirmPassword ? 'cpw-visible' : 'cpw-hidden'}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="flex items-center justify-center"
                                                >
                                                    {showConfirmPassword ? (
                                                        <EyeOff className="size-3.5 sm:size-4" strokeWidth={1.9} />
                                                    ) : (
                                                        <Eye className="size-3.5 sm:size-4" strokeWidth={1.9} />
                                                    )}
                                                </motion.span>
                                            </AnimatePresence>
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Registration Pending Notice */}
                        <AnimatePresence>
                            {notice && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                    transition={{ duration: 0.2 }}
                                    role="status"
                                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-800 leading-snug shadow-2xs"
                                >
                                    <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-0.5">
                                        <svg className="size-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Registration Queued for Approval
                                    </div>
                                    {notice}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Error Banner with Subtle Shake */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        scale: 1,
                                        x: [0, -5, 5, -3, 3, -1, 1, 0],
                                    }}
                                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                    transition={{ duration: 0.3 }}
                                    role="alert"
                                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-700"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: loading ? 1 : 1.01 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className="mt-1 flex h-9 sm:h-9.5 w-full items-center justify-center rounded-xl bg-[#0071e3] px-4 text-xs sm:text-sm font-semibold text-white shadow-2xs transition-colors hover:bg-[#0077ed] active:bg-[#0062c4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <LoadingIndicator type="dot-circle" size="sm" className="text-white" />
                                    <span>{isRegistering ? 'Registering…' : 'Signing in…'}</span>
                                </span>
                            ) : (
                                isRegistering ? 'Create Account' : 'Sign In'
                            )}
                        </motion.button>
                    </form>

                    {/* Mode Toggle Link */}
                    <div className="mt-3 pt-2 border-t border-slate-100 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setError('');
                            }}
                            className="text-[11px] font-medium text-[#0071e3] hover:underline focus-visible:outline-none transition-transform active:scale-98"
                        >
                            {isRegistering
                                ? 'Already have an institutional account? Sign In'
                                : 'New faculty member? Register as Teacher'}
                        </button>
                    </div>
                </motion.div>

                <div className="mt-2 text-center text-[10px] sm:text-[11px] text-slate-400">
                    Department of Education • Division of Laguna
                </div>
            </div>
        </main>
    );
}
