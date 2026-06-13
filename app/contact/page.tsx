import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Globe2, Linkedin, Mail, Phone } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="auth-landing contact-page">
      <header className="auth-topbar">
        <Link href="/" className="auth-wordmark">
          <Image src="/sitetrack-mark.png" alt="" width={300} height={300} priority />
          <span>SiteTrack</span>
        </Link>
        <nav className="auth-nav" aria-label="Product">
          <Link href="/#product">Product</Link>
          <Link href="/#workflow">Workflow</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/#about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/login">Sign in</Link>
          <Link href="/signup" className="auth-nav-cta">Create account</Link>
        </nav>
      </header>

      <main className="about-contact-shell">
        <section className="about-product">
          <div className="about-product-heading">
            <Image src="/sitetrack-mark.png" alt="" width={300} height={300} priority />
            <div>
              <h1>SiteTrack</h1>
              <p>A JTK LABS product</p>
            </div>
          </div>

          <p>
            SiteTrack helps construction teams manage employee records, daily site
            attendance, salary visibility, and payment tracking from one focused
            operations workspace. It is built by JTK LABS for practical construction
            workforce management workflows.
          </p>

          <div className="about-actions">
            <a href="https://jtklabs.net" target="_blank" rel="noreferrer" className="btn btn-outline btn-large">
              <Globe2 size={17} />
              Visit JTK LABS
            </a>
            <Link href="/features" className="btn btn-dark btn-large">
              View features
            </Link>
          </div>
        </section>

        <aside className="connect-card">
          <h2>Connect with us</h2>

          <div className="connect-list">
            <a href="https://www.linkedin.com/company/jtk-labs" target="_blank" rel="noreferrer" className="connect-item">
              <span className="connect-icon info">
                <Linkedin size={22} />
              </span>
              <span>
                <small>LinkedIn</small>
                <strong>JTK LABS</strong>
              </span>
              <ExternalLink size={16} />
            </a>

            <a href="mailto:info@jtklabs.net" className="connect-item">
              <span className="connect-icon warning">
                <Mail size={22} />
              </span>
              <span>
                <small>Email</small>
                <strong>info@jtklabs.net</strong>
              </span>
            </a>

            <a href="https://wa.me/94756999010" target="_blank" rel="noreferrer" className="connect-item">
              <span className="connect-icon success">
                <Phone size={22} />
              </span>
              <span>
                <small>WhatsApp support</small>
                <strong>+94 75 699 9010</strong>
              </span>
            </a>
          </div>
        </aside>
      </main>

      <footer className="about-footer">
        <span>© 2026 SiteTrack by JTK LABS. All rights reserved.</span>
        <nav aria-label="Contact">
          <Link href="/">SiteTrack</Link>
        </nav>
      </footer>
    </div>
  );
}
