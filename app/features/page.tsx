import Image from 'next/image';
import Link from 'next/link';
import { BarChart3, CalendarCheck, CheckCircle2, ShieldCheck, Users, Wallet } from 'lucide-react';

const featureCards = [
  {
    icon: Users,
    title: 'Workforce directory',
    text: 'Manage employee records, roles, rates, contacts, and active status in one clean workspace.',
  },
  {
    icon: CalendarCheck,
    title: 'Daily attendance',
    text: 'Record present, absent, half-day, working hours, and site assignments without spreadsheet clutter.',
  },
  {
    icon: Wallet,
    title: 'Salary visibility',
    text: 'Track earned amounts, payments made, and outstanding balances from attendance records.',
  },
  {
    icon: BarChart3,
    title: 'Operational reports',
    text: 'Review site activity, workforce status, and payment exposure before payroll decisions.',
  },
];

export default function FeaturesPage() {
  return (
    <div className="auth-landing features-page">
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

      <main className="features-hero">
        <section className="features-intro">
          <div className="hero-badge">
            <ShieldCheck size={16} />
            Built for construction site operations
          </div>
          <h1>Everything your site team needs before payroll becomes messy.</h1>
          <p>
            SiteTrack keeps construction employee records, attendance, site activity,
            and payment visibility connected in one professional workspace.
          </p>
          <div className="hero-actions">
            <Link href="/signup" className="btn btn-primary btn-large">
              Start workspace
            </Link>
            <Link href="/login" className="btn btn-outline btn-large">
              Sign in
            </Link>
          </div>
        </section>

        <section className="features-dashboard-preview" aria-label="SiteTrack preview">
          <div className="preview-topline">
            <span>Today&apos;s site pulse</span>
            <strong>Live overview</strong>
          </div>
          <div className="preview-metrics">
            <div>
              <span>Active crew</span>
              <strong>48</strong>
            </div>
            <div>
              <span>Present today</span>
              <strong>42</strong>
            </div>
            <div>
              <span>Open balance</span>
              <strong>Rs. 186k</strong>
            </div>
          </div>
          <div className="preview-list">
            <p><CheckCircle2 size={17} /> Attendance synced with salary exposure</p>
            <p><CheckCircle2 size={17} /> Site assignments visible by day</p>
            <p><CheckCircle2 size={17} /> Payment records attached to employees</p>
          </div>
        </section>
      </main>

      <section id="features" className="features-grid-expanded">
        {featureCards.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title}>
              <Icon size={24} />
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </article>
          );
        })}
      </section>

      <footer className="auth-copyright">
        SiteTrack by JTK Labs Pvt Ltd
      </footer>
    </div>
  );
}
