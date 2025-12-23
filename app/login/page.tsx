'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
    // const { login } = useApp(); // Removed
    const router = useRouter();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLongLoading, setIsLongLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        setIsLongLoading(false);

        // Show "Waking up database" message if it takes > 4 seconds
        const slowTimer = setTimeout(() => {
            setIsLongLoading(true);
        }, 4000);

        const { error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
        });

        clearTimeout(slowTimer);

        if (error) {
            setError(error.message);
            setIsLoading(false);
            setIsLongLoading(false);
        } else {
            router.push('/');
            // Keep loading true while redirecting
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
                    <p className="brand-tagline">Managing your workforce, simplified.</p>
                </div>

                <div className="brand-testimonial">
                    <blockquote>
                        "ConstructionOS has completely transformed how we manage our daily attendance and payments. It's the digital foundation our sites needed."
                    </blockquote>
                    <div className="testimonial-author">
                        <div className="author-avatar"></div>
                        <div>
                            <div className="author-name">Michael Torres</div>
                            <div className="author-role">Site Supervisor, Apex Builders</div>
                        </div>
                    </div>
                </div>

                <div className="brand-bg-decoration">
                    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 100 L100 0 L100 100 Z" fill="currentColor" />
                    </svg>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="auth-form-side">
                <div className="auth-form-container">
                    <div className="auth-header">
                        <h2>Welcome back</h2>
                        <p>Enter your credentials to access your workspace.</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Cold Start Hint */}
                    {isLongLoading && (
                        <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-md border border-blue-100 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                            <Loader2 className="animate-spin shrink-0 mt-0.5" size={16} />
                            <div>
                                <p className="font-semibold">Waking up the database...</p>
                                <p>Since this is a free server, it goes to sleep when inactive. Please wait ~10-20 seconds while it boots up.</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
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
                            <div className="label-row">
                                <label className="label">Password</label>
                                <a href="#" className="link-forgot">Forgot password?</a>
                            </div>
                            <input
                                type="password"
                                required
                                className="input"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary btn-block btn-large mt-4 flex justify-center items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    {isLongLoading ? 'Still connecting...' : 'Signing in...'}
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <div className="divider-line"></div>
                        <span className="divider-text">Or continue with</span>
                    </div>

                    <div className="auth-footer text-center">
                        <span className="text-muted">Don't have an account? </span>
                        <Link href="/signup" className="link-primary">
                            Create a free account
                        </Link>
                    </div>
                </div>

                <div className="auth-copyright">
                    &copy; 2024 ConstructionOS. All rights reserved.
                </div>
            </div>
        </div>
    );
}
