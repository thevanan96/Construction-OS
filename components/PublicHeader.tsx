'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

type PublicNavLink = {
  label: string;
  href: string;
  cta?: boolean;
};

const baseLinks: PublicNavLink[] = [
  { label: 'Product', href: '/#product' },
  { label: 'Workflow', href: '/#workflow' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'About', href: '/#about' },
  { label: 'Contact', href: '/contact' },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const authLink: PublicNavLink = pathname === '/login'
    ? { label: 'Create account', href: '/signup', cta: true }
    : pathname === '/signup'
      ? { label: 'Sign in', href: '/login' }
      : { label: 'Sign in', href: '/login' };
  const links = pathname === '/login' || pathname === '/signup'
    ? [...baseLinks, authLink]
    : [...baseLinks, { label: 'Sign in', href: '/login' }, { label: 'Create account', href: '/signup', cta: true }];

  return (
    <header className="auth-topbar public-header">
      <Link href="/" className="auth-wordmark" onClick={() => setIsOpen(false)}>
        <Image src="/sitetrack-mark.png" alt="" width={300} height={300} priority />
        <span>SiteTrack</span>
      </Link>

      <nav className="auth-nav public-nav-desktop" aria-label="Product">
        {links.map((link) => (
          <Link key={`${link.href}-${link.label}`} href={link.href} className={link.cta ? 'auth-nav-cta' : undefined}>
            {link.label}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        className="public-nav-toggle"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? <X size={19} /> : <Menu size={19} />}
        <span>Menu</span>
      </button>

      {isOpen && (
        <nav className="public-nav-dropdown" aria-label="Mobile product navigation">
          {links.map((link) => (
            <Link
              key={`${link.href}-${link.label}-mobile`}
              href={link.href}
              className={link.cta ? 'auth-nav-cta' : undefined}
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
