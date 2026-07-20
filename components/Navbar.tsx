'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CalendarCheck, Banknote, Building, LogOut, FileText, Menu, RefreshCw, Settings, WifiOff, X } from 'lucide-react';
import { useApp } from '@/lib/store';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Employees', href: '/employees', icon: Users },
    { name: 'Sites', href: '/sites', icon: Building },
    { name: 'Attendance', href: '/attendance', icon: CalendarCheck },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Payments', href: '/salary', icon: Banknote },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export function Navbar() {
    const pathname = usePathname();
    const { user, logout, isOffline, pendingSyncCount } = useApp();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <header className="navbar">
            <div className="navbar-left">
                <div className="navbar-brand">
                    <Image src="/fieldmetrik-mark.png" alt="" width={300} height={300} priority />
                    <span className="navbar-brand-text brand-wordmark" aria-label="FieldMetrik">
                        <span>Field</span>
                        <span className="brand-wordmark-accent">Metrik</span>
                    </span>
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
                {isOffline ? (
                    <span className="sync-status-pill sync-status-offline" title="You're offline. Changes will sync automatically once reconnected.">
                        <WifiOff size={14} />
                        <span>Offline{pendingSyncCount > 0 ? ` · ${pendingSyncCount} pending` : ''}</span>
                    </span>
                ) : pendingSyncCount > 0 ? (
                    <span className="sync-status-pill sync-status-syncing" title="Syncing offline changes...">
                        <RefreshCw size={14} className="sync-status-spin" />
                        <span>Syncing {pendingSyncCount}…</span>
                    </span>
                ) : null}
                <Link href="/settings" className={`user-profile user-profile-link ${pathname === '/settings' ? 'active' : ''}`}>
                    <div className="user-avatar">
                        {user?.name.charAt(0)}
                    </div>
                    <div className="user-info navbar-desktop-only">
                        <span className="user-name">{user?.name}</span>
                        <span className="user-role">{user?.companyName}</span>
                    </div>
                </Link>
                <div className="vertical-divider navbar-desktop-only"></div>
                <button
                    onClick={logout}
                    className="btn-logout navbar-desktop-only"
                    title="Sign Out"
                    aria-label="Sign out"
                >
                    <LogOut size={18} />
                </button>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="navbar-mobile-only icon-button"
                    aria-label="Open navigation menu"
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
