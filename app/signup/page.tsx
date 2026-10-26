'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, BarChart3, Building2, CalendarCheck, Eye, EyeOff, Loader2, ShieldCheck, Users } from 'lucide-react';
import { PublicHeader } from '@/components/PublicHeader';

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        companyName: '',
        name: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const handleGoogleSignup = async () => {
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

        const { error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    full_name: formData.name,
                    company_name: formData.companyName,
                }
            }
        });

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
                        Start a FieldMetrik workspace
                    </div>
                    <h1>Create a modern operating rhythm for every site day.</h1>
                    <p>
                        Set up FieldMetrik for employee records, Quick Mark attendance,
                        site assignments, reports, and payment visibility from day one.
                    </p>

                    <div className="hero-actions">
                        <Link href="/login" className="btn btn-outline btn-large">
                            Existing workspace
                        </Link>
                    </div>

                    <div className="auth-stats" aria-label="FieldMetrik highlights">
                        <div>
                            <strong>Simple</strong>
                            <span>company setup</span>
                        </div>
                        <div>
                            <strong>Mobile</strong>
                            <span>site workflows</span>
                        </div>
                        <div>
                            <strong>Ready</strong>
                            <span>for payroll review</span>
                        </div>
                    </div>
                </section>

                <aside className="auth-panel">
                    <div className="auth-form-container">
                        <div className="auth-logo">
                            <Image src="/fieldmetrik-mark.png" alt="" width={300} height={300} priority />
                            <div className="auth-logo-text">
                                <strong>Create workspace</strong>
                                <span>Start using FieldMetrik</span>
                            </div>
                        </div>

                        <div className="auth-header">
                            <h2>Company account</h2>
                            <p>Set up your company account for crew and site operations.</p>
                        </div>

                        {error && (
                            <div className="auth-error">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleGoogleSignup}
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
                            <span>or sign up with email</span>
                        </div>

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-group">
                                <label className="label">Company Name</label>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        required
                                        className="input"
                                        placeholder="Acme Builders"
                                        value={formData.companyName}
                                        onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                    />
                                    <span className="input-icon-btn" aria-hidden="true">
                                        <Building2 size={17} />
                                    </span>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="label">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="input"
                                    placeholder="Your name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="input"
                                    placeholder="name@company.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Password</label>
                                <div className="input-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        className="input"
                                        placeholder="Create a strong password"
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
                                <p className="helper-text text-right">Use at least 8 characters.</p>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-block btn-large mt-4"
                            >
                                Create Account
                            </button>
                        </form>

                        <div className="auth-footer">
                            <span>Already have an account? </span>
                            <Link href="/login" className="link-primary">
                                Sign in
                            </Link>
                        </div>
                    </div>
                </aside>
            </main>

            <section id="features" className="landing-feature-grid">
                <article>
                    <Users size={22} />
                    <h2>Workforce directory</h2>
                    <p>Create employee records with rates, roles, contacts, and active status.</p>
                </article>
                <article>
                    <CalendarCheck size={22} />
                    <h2>Attendance workflow</h2>
                    <p>Mark site attendance, working hours, absences, and half days without clutter.</p>
                </article>
                <article id="security">
                    <BarChart3 size={22} />
                    <h2>Payment records</h2>
                    <p>Keep earnings, payments, and balances aligned with daily attendance.</p>
                </article>
            </section>

            <footer className="auth-copyright">
                    © 2026 FieldMetrik by JTK LABS.
            </footer>
        </div>
    );
}
