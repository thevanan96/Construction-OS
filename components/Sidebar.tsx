'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CalendarCheck, Banknote, Building, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { useApp } from '@/lib/store';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Employees', href: '/employees', icon: Users },
    { name: 'Sites', href: '/sites', icon: Building },
    { name: 'Attendance', href: '/attendance', icon: CalendarCheck },
    { name: 'Salary & Payments', href: '/salary', icon: Banknote },
];

export function Sidebar() {
    const pathname = usePathname();
    const { logout } = useApp();

    return (
        <aside className="sidebar">
            <div className="brand">
                <h1>Construction<span>OS</span></h1>
                <p>Employee Management</p>
            </div>
            <nav className="nav-menu">
                <ul className="list-none">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.href} className="nav-item">
                                <Link
                                    href={item.href}
                                    className={`nav-link ${isActive ? 'active' : ''}`}
                                >
                                    <Icon size={20} />
                                    <span>{item.name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            <div className="sidebar-footer">
                <button
                    onClick={logout}
                    className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors w-full p-2"
                >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
