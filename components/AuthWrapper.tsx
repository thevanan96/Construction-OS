'use client';

import { useApp } from '@/lib/store';
import { Navbar } from '@/components/Navbar';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useApp();
    const path = usePathname();
    const isAuthPage = path === '/login' || path === '/signup';
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        if (!user && !isAuthPage) {
            router.push('/login');
        } else if (user && isAuthPage) {
            router.push('/');
        }
    }, [user, isLoading, isAuthPage, path, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: '100vh', padding: '24px' }}>
                <div className="panel text-center" style={{ width: 'min(100%, 360px)' }}>
                    <div className="logo-icon mx-auto mb-4">C</div>
                    <div className="animate-pulse font-bold text-lg" style={{ color: 'var(--color-dark)' }}>
                        Preparing your workspace
                    </div>
                    <p className="page-subtitle">Syncing teams, sites, attendance, and payments.</p>
                </div>
            </div>
        );
    }

    if (isAuthPage) {
        // Prevent flashing auth page if user is actually logged in (handled by useEffect redirect)
        if (user) return null;
        return <main className="w-full">{children}</main>;
    }

    if (!user) return null;

    return (
        <div className="app-layout-horizontal">
            <Navbar />
            <main className="main-content-horizontal">
                {children}
            </main>
        </div>
    );
}
