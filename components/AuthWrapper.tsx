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
            <div className="flex min-h-screen w-full items-center justify-center bg-[var(--color-light)]">
                <div className="animate-pulse text-[var(--color-primary)] font-bold text-xl">
                    Loading ConstructionOS...
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
