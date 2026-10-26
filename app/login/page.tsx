'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, BarChart3, CalendarCheck, Eye, EyeOff, Loader2, ShieldCheck, Users } from 'lucide-react';
import { PublicHeader } from '@/components/PublicHeader';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setError('');
        setIsGoogleLoading(true);

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/dashboard` },
        });

        if (error) {
            setError(error.message);
            setIsGoogleLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
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
                    <h1>Sign in to keep today&apos;s site operations moving.</h1>
                    <p>
                        Continue managing crew records, Quick Mark attendance, active sites,
                        and payment visibility from your FieldMetrik workspace.
                    </p>

                    <div className="hero-actions">
                        <Link href="/signup" className="btn btn-primary btn-large">
                            Start workspace
                        </Link>
                        <Link href="/#product" className="btn btn-outline btn-large">
                            Explore product
                        </Link>
                    </div>

                    <div className="auth-stats" aria-label="FieldMetrik highlights">
                        <div>
                            <strong>Quick</strong>
                            <span>attendance marking</span>
                        </div>
                        <div>
                            <strong>Live</strong>
                            <span>payment visibility</span>
                        </div>
                        <div>
                            <strong>Multi-site</strong>
                            <span>crew tracking</span>
                        </div>
                    </div>
                </section>

                <aside className="auth-panel">
                    <div className="auth-form-container">
                        <div className="auth-logo">
                            <Image src="/fieldmetrik-mark.png" alt="" width={300} height={300} priority />
                            <div className="auth-logo-text">
                                <strong>Welcome back</strong>
                                <span>Sign in to FieldMetrik</span>
                            </div>
                        </div>

                        <div className="auth-header">
                            <h2>Access your workspace</h2>
                            <p>Manage crews, attendance, sites, and payments.</p>
                        </div>

                        {error && (
                            <div className="auth-error">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isGoogleLoading}
                            className="btn btn-outline btn-block btn-large btn-google"
                        >
                            {isGoogleLoading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                </svg>
                            )}
                            Continue with Google
                        </button>

                        <div className="auth-divider">
                            <span>or sign in with email</span>
                        </div>

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-group">
                                <label className="label">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    autoComplete="email"
                                    className="input"
                                    placeholder="name@company.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <div className="label-row">
                                    <label className="label">Password</label>
                                    <Link href="/forgot-password" className="link-forgot">Forgot password?</Link>
                                </div>
                                <div className="input-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        autoComplete="current-password"
                                        className="input"
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
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

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary btn-block btn-large mt-4"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Signing in
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <span>Don&apos;t have an account? </span>
                            <Link href="/signup" className="link-primary">
                                Create account
                            </Link>
                        </div>
                    </div>
                </aside>
            </main>

            <section id="features" className="landing-feature-grid">
                <article>
                    <Users size={22} />
                    <h2>Crew records</h2>
                    <p>Keep employee details, roles, rates, contacts, and active status organized.</p>
                </article>
                <article>
                    <CalendarCheck size={22} />
                    <h2>Attendance workflows</h2>
                    <p>Mark daily attendance, half days, absences, sites, and working hours.</p>
                </article>
                <article id="security">
                    <BarChart3 size={22} />
                    <h2>Payment clarity</h2>
                    <p>See earned amounts, payments made, and balances before payroll turns messy.</p>
                </article>
            </section>

            <footer className="auth-copyright">
                    © 2026 FieldMetrik by JTK LABS.
            </footer>
        </div>
    );
}
