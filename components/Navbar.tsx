'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CalendarCheck, Banknote, Building, LogOut, FileText } from 'lucide-react';
import { useApp } from '@/lib/store';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Employees', href: '/employees', icon: Users },
    { name: 'Sites', href: '/sites', icon: Building },
    { name: 'Attendance', href: '/attendance', icon: CalendarCheck },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Salary', href: '/salary', icon: Banknote },
];

export function Navbar() {
    const pathname = usePathname();
    const { user, logout } = useApp();

    return (
        <header className="navbar">
            <div className="navbar-left">
                <div className="navbar-brand">
                    <h1>Construction<span>OS</span></h1>
                </div>

                <nav className="navbar-menu">
                    <ul>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`nav-link-horizontal ${isActive ? 'active' : ''}`}
                                    >
                                        <Icon size={18} />
                                        <span>{item.name}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>

            <div className="navbar-right">
                <div className="user-profile">
                    <div className="user-avatar">
                        {user?.name.charAt(0)}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{user?.name}</span>
                        <span className="user-role">{user?.companyName}</span>
                    </div>
                </div>
                <div className="vertical-divider"></div>
                <button
                    onClick={logout}
                    className="btn-logout"
                    title="Sign Out"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
}
