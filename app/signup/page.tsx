'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, BarChart3, Building2, CalendarCheck, Eye, EyeOff, ShieldCheck, Users } from 'lucide-react';
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
