'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
    // const { register } = useApp();
    const router = useRouter();
    const [formData, setFormData] = useState({
        companyName: '',
        name: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const { error, data } = await supabase.auth.signUp({
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
            // Trigger profile creation is handled by DB trigger, but we could do it here too if needed
            router.push('/');
        }
    };

    return (
        <div className="auth-page">
            {/* Left Side - Brand Showcase */}
            <div className="auth-brand-side">
                <div className="brand-content-top">
                    <div className="brand-logo-large">
                        <div className="logo-icon">C</div>
                        <h1>Construction<span>OS</span></h1>
                    </div>
                    <p className="brand-tagline">Start managing efficiently today.</p>
                </div>

                <div className="brand-features">
                    <div className="feature-item">
                        <div className="feature-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
                        </div>
                        <div>
                            <h3>Manage Workforce</h3>
                            <p>Track employees, roles, and daily rates with ease.</p>
                        </div>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </div>
                        <div>
                            <h3>Smart Attendance</h3>
                            <p>Daily logs, site tracking, and automated summaries.</p>
                        </div>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                        </div>
                        <div>
                            <h3>Automated Payroll</h3>
                            <p>Calculate dues instantly based on attendance records.</p>
                        </div>
                    </div>
                </div>

                <div className="brand-bg-decoration">
                    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <circle cx="90" cy="10" r="40" fill="currentColor" />
                    </svg>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="auth-form-side">
                <div className="auth-form-container">
                    <div className="auth-header">
                        <h2>Create an account</h2>
                        <p>Start managing your construction projects today.</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label className="label">Company Name</label>
                            <input
                                type="text"
                                required
                                className="input"
                                placeholder="Acme Builders Inc."
                                value={formData.companyName}
                                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Full Name</label>
                            <input
                                type="text"
                                required
                                className="input"
                                placeholder="John Doe"
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
                            <input
                                type="password"
                                required
                                className="input"
                                placeholder="Create a strong password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                            <p className="helper-text text-right">Must be at least 8 characters</p>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block btn-large mt-4"
                        >
                            Create Account
                        </button>
                    </form>

                    <div className="auth-footer text-center">
                        <span className="text-muted">Already have an account? </span>
                        <Link href="/login" className="link-primary">
                            Sign in here
                        </Link>
                    </div>
                </div>
                <div className="auth-copyright">
                    Terms of Service &bull; Privacy Policy
                </div>
            </div>
        </div>
    );
}
