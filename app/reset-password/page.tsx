'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { PublicHeader } from '@/components/PublicHeader';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [hasValidSession, setHasValidSession] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setHasValidSession(!!session);
            setIsCheckingSession(false);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        setIsLoading(false);

        if (error) {
            setError(error.message);
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <div className="auth-landing">
            <PublicHeader />

            <main className="auth-hero">
                <section className="auth-hero-copy">
                    <div className="hero-badge">
                        <ShieldCheck size={16} />
                        Secure FieldMetrik access
                    </div>
                    <h1>Set a new password.</h1>
                    <p>Choose a new password to get back into your FieldMetrik workspace.</p>
                </section>

                <aside className="auth-panel">
                    <div className="auth-form-container">
                        <div className="auth-logo">
                            <Image src="/fieldmetrik-mark.png" alt="" width={300} height={300} priority />
                            <div className="auth-logo-text">
                                <strong>Reset password</strong>
                                <span>Choose a new password</span>
                            </div>
                        </div>

                        {isCheckingSession ? (
                            <div className="auth-header">
                                <p>Checking your reset link&hellip;</p>
                            </div>
                        ) : !hasValidSession ? (
                            <>
                                <div className="auth-header">
                                    <h2>This link is invalid or expired</h2>
                                    <p>Password reset links only work once and expire after a while. Request a new one below.</p>
                                </div>
                                <Link href="/forgot-password" className="btn btn-primary btn-block btn-large">
                                    Request a new link
                                </Link>
                            </>
                        ) : (
                            <>
                                <div className="auth-header">
                                    <h2>Choose a new password</h2>
                                    <p>Use at least 8 characters.</p>
                                </div>

                                {error && (
                                    <div className="auth-error">
                                        <AlertCircle size={18} />
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="auth-form">
                                    <div className="form-group">
                                        <label className="label">New Password</label>
                                        <div className="input-wrapper">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                autoComplete="new-password"
                                                className="input"
                                                placeholder="Enter a new password"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                tabIndex={-1}
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="input-icon-btn"
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Confirm Password</label>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            autoComplete="new-password"
                                            className="input"
                                            placeholder="Re-enter the new password"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="btn btn-primary btn-block btn-large mt-4"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={18} />
                                                Updating password
                                            </>
                                        ) : (
                                            'Update password'
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </aside>
            </main>

            <footer className="auth-copyright">
                © 2026 FieldMetrik by JTK LABS.
            </footer>
        </div>
    );
}
