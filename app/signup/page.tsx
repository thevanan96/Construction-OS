'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ElementType } from 'react';
import { AlertCircle, Building2, CalendarCheck, Eye, EyeOff, ShieldCheck, Users } from 'lucide-react';

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
            router.push('/');
        }
    };

    return (
        <div className="auth-page">
            <aside className="auth-brand-side">
                <div className="auth-brand-content">
                    <div>
                        <div className="brand-logo-large">
                            <div className="logo-icon">C</div>
                            <h1>Construction<span>OS</span></h1>
                        </div>
                        <p className="brand-tagline">Set up a cleaner operating rhythm for every site day.</p>
                    </div>

                    <div className="auth-showcase">
                        <h2>Start with the essentials: people, sites, attendance, and payments.</h2>
                        <p>A focused workspace for contractors and site supervisors who need reliable daily records.</p>
                        <div className="brand-features">
                            <Feature icon={Users} title="Workforce Directory" text="Create employee records with roles, rates, contact details, and active status." />
                            <Feature icon={CalendarCheck} title="Attendance Workflow" text="Mark daily shifts, hours, roles, and site assignments without clutter." />
                            <Feature icon={ShieldCheck} title="Operational Records" text="Keep payment and reporting history aligned with your attendance data." />
                        </div>
                    </div>
                </div>
            </aside>

            <main className="auth-form-side">
                <div className="auth-form-container">
                    <div className="auth-header">
                        <h2>Create your workspace</h2>
                        <p>Set up your company account and begin organizing site operations.</p>
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

                <div className="auth-copyright">
                    Terms of Service - Privacy Policy
                </div>
            </main>
        </div>
    );
}

function Feature({ icon: Icon, title, text }: { icon: ElementType; title: string; text: string }) {
    return (
        <div className="feature-item">
            <div className="feature-icon">
                <Icon size={20} />
            </div>
            <div>
                <h3>{title}</h3>
                <p>{text}</p>
            </div>
        </div>
    );
}
