'use client';

import { useState } from 'react';
import type { ElementType } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CalendarCheck, Eye, EyeOff, HardHat, Loader2, Wallet } from 'lucide-react';

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
                        <p className="brand-tagline">Workforce control for busy construction teams.</p>
                    </div>

                    <div className="auth-showcase">
                        <h2>Keep every site day organized before payroll becomes messy.</h2>
                        <p>Track employees, site attendance, hours, and payment exposure in one focused operations workspace.</p>
                        <div className="brand-features">
                            <Feature icon={HardHat} title="Crew Records" text="Roles, rates, contacts, and active status stay ready for daily use." />
                            <Feature icon={CalendarCheck} title="Daily Attendance" text="Fast site logs with role, time, and status controls." />
                            <Feature icon={Wallet} title="Payment Clarity" text="Balances and payment history stay visible without spreadsheet chasing." />
                        </div>
                    </div>
                </div>
            </aside>

            <main className="auth-form-side">
                <div className="auth-form-container">
                    <div className="auth-header">
                        <h2>Welcome back</h2>
                        <p>Sign in to manage today&apos;s site operations.</p>
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

                <div className="auth-copyright">
                    ConstructionOS
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
