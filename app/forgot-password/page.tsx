'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { PublicHeader } from '@/components/PublicHeader';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        setIsLoading(false);

        if (error) {
            setError(error.message);
        } else {
            setIsSent(true);
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
                    <h1>Reset access to your workspace.</h1>
                    <p>
                        Enter the email address on your FieldMetrik account and we&apos;ll send you a link
                        to set a new password.
                    </p>
                </section>

                <aside className="auth-panel">
                    <div className="auth-form-container">
                        <div className="auth-logo">
                            <Image src="/fieldmetrik-mark.png" alt="" width={300} height={300} priority />
                            <div className="auth-logo-text">
                                <strong>Forgot password</strong>
                                <span>Reset your FieldMetrik password</span>
                            </div>
                        </div>

                        {isSent ? (
                            <>
                                <div className="auth-header">
                                    <h2>Check your email</h2>
                                    <p>
                                        If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset
                                        your password. It may take a minute to arrive.
                                    </p>
                                </div>
                                <div className="auth-success">
                                    <CheckCircle2 size={18} />
                                    Reset link sent.
                                </div>
                                <div className="auth-footer">
                                    <Link href="/login" className="link-primary">
                                        Back to sign in
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="auth-header">
                                    <h2>Forgot your password?</h2>
                                    <p>We&apos;ll email you a link to reset it.</p>
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
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
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
                                                Sending link
                                            </>
                                        ) : (
                                            'Send reset link'
                                        )}
                                    </button>
                                </form>

                                <div className="auth-footer">
                                    <span>Remembered it? </span>
                                    <Link href="/login" className="link-primary">
                                        Sign in
                                    </Link>
                                </div>
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
