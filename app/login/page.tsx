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
                        Secure SiteTrack access
                    </div>
                    <h1>Sign in to keep today&apos;s site operations moving.</h1>
                    <p>
                        Continue managing crew records, Quick Mark attendance, active sites,
                        and payment visibility from your SiteTrack workspace.
                    </p>

                    <div className="hero-actions">
                        <Link href="/signup" className="btn btn-primary btn-large">
                            Start workspace
                        </Link>
                        <Link href="/#product" className="btn btn-outline btn-large">
                            Explore product
                        </Link>
                    </div>

                    <div className="auth-stats" aria-label="SiteTrack highlights">
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
                            <Image src="/sitetrack-mark.png" alt="" width={300} height={300} priority />
                            <div className="auth-logo-text">
                                <strong>Welcome back</strong>
                                <span>Sign in to SiteTrack</span>
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
                                    <a href="#" className="link-forgot">Forgot password?</a>
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
                    © 2026 SiteTrack by JTK LABS.
            </footer>
        </div>
    );
}
