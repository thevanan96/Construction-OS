'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CalendarCheck, Banknote, Building, LogOut, FileText, Menu, X } from 'lucide-react';
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <header className="navbar">
            <div className="navbar-left">
                <div className="navbar-brand">
                    <h1>Construction<span>OS</span></h1>
                </div>

                <nav className="navbar-menu navbar-desktop-only">
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
                    <div className="user-info navbar-desktop-only">
                        <span className="user-name">{user?.name}</span>
                        <span className="user-role">{user?.companyName}</span>
                    </div>
                </div>
                <div className="vertical-divider navbar-desktop-only"></div>
                <button
                    onClick={logout}
                    className="btn-logout navbar-desktop-only"
                    title="Sign Out"
                >
                    <LogOut size={18} />
                </button>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="navbar-mobile-only p-2 text-white hover:bg-white/10 rounded-lg ml-2"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="mobile-menu-dropdown">
                    <ul className="mobile-menu-list">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`mobile-menu-item ${isActive
                                            ? 'active'
                                            : ''
                                            }`}
                                    >
                                        <Icon size={20} />
                                        <span>{item.name}</span>
                                    </Link>
                                </li>
                            );
                        })}
                        {/* Mobile Logout */}
                        <li>
                            <button
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    logout();
                                }}
                                className="mobile-menu-item mobile-logout"
                            >
                                <LogOut size={20} />
                                <span>Sign Out</span>
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </header>
    );
}
