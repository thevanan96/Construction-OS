import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Globe2, Linkedin, Mail, Phone } from 'lucide-react';
import { PublicHeader } from '@/components/PublicHeader';

export default function ContactPage() {
  return (
    <div className="auth-landing contact-page">
      <PublicHeader />

      <main className="about-contact-shell">
        <section className="about-product">
          <div className="about-product-heading">
            <Image src="/fieldmetrik-mark.png" alt="" width={300} height={300} priority />
            <div>
              <h1>Talk to JTK LABS about FieldMetrik</h1>
              <p>Construction workforce management support</p>
            </div>
          </div>

          <p>
            Need help setting up FieldMetrik for your construction company?
            Contact JTK LABS for workspace setup, rollout support, or product questions
            about attendance, sites, reports, and payments.
          </p>

          <div className="about-actions">
            <a href="https://jtklabs.net" target="_blank" rel="noreferrer" className="btn btn-outline btn-large">
              <Globe2 size={17} />
              Visit JTK LABS
            </a>
            <Link href="/#product" className="btn btn-dark btn-large">
              Explore product
            </Link>
          </div>
        </section>

        <aside className="connect-card">
          <h2>Choose a contact channel</h2>

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
        <span>© 2026 FieldMetrik by JTK LABS. All rights reserved.</span>
        <nav aria-label="Contact">
          <Link href="/">FieldMetrik</Link>
        </nav>
      </footer>
    </div>
  );
}
