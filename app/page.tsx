import Image from 'next/image';
import Link from 'next/link';
import {
  CalendarCheck,
  ClipboardList,
  ExternalLink,
  Linkedin,
  Mail,
  Phone,
  Users,
  Wallet,
} from 'lucide-react';

const productCards = [
  {
    icon: Users,
    title: 'Employee records',
    text: 'Keep crew profiles, roles, rates, contact details, and active status ready for site operations.',
  },
  {
    icon: CalendarCheck,
    title: 'Attendance tracking',
    text: 'Mark present, absent, half-day, working hours, and site assignments from one workflow.',
  },
  {
    icon: Wallet,
    title: 'Payment visibility',
    text: 'Review earned amounts, payments made, and balances before payroll becomes messy.',
  },
];

const workflowSteps = [
  'Create employee and site records',
  'Mark daily attendance and hours',
  'Review salary exposure and payments',
  'Export operational reports when needed',
];

export default function LandingPage() {
  return (
    <div className="auth-landing marketing-home">
      <header className="auth-topbar">
        <Link href="/" className="auth-wordmark">
          <Image src="/sitetrack-mark.png" alt="" width={300} height={300} priority />
          <span>SiteTrack</span>
        </Link>
        <nav className="auth-nav" aria-label="Product">
          <a href="#product">Product</a>
          <a href="#workflow">Workflow</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a>
          <Link href="/login">Sign in</Link>
          <Link href="/signup" className="auth-nav-cta">Create account</Link>
        </nav>
      </header>

      <main className="marketing-hero">
        <section className="marketing-copy">
          <div className="hero-badge">
            <ClipboardList size={16} />
            Construction workforce management
          </div>
          <h1>Site operations, attendance, and payment records in one workspace.</h1>
          <p>
            SiteTrack helps construction teams keep daily crew records clean,
            payroll visibility clear, and site activity organized without spreadsheet chasing.
          </p>
          <div className="hero-actions">
            <Link href="/signup" className="btn btn-primary btn-large">Start workspace</Link>
            <a href="#product" className="btn btn-outline btn-large">Explore product</a>
          </div>
        </section>

        <section className="site-hero-visual" aria-label="Construction site operations preview">
          <Image
            src="/sitetrack-hero-site.png"
            alt="Construction site supervisors reviewing SiteTrack operations on a tablet"
            width={1792}
            height={1024}
            priority
          />
          <div className="site-hero-overlay">
            <div className="preview-topline">
              <span>Today&apos;s site pulse</span>
              <strong>Live</strong>
            </div>
            <div className="preview-metrics">
              <div>
                <span>Active crew</span>
                <strong>48</strong>
              </div>
              <div>
                <span>Present</span>
                <strong>42</strong>
              </div>
              <div>
                <span>Balance</span>
                <strong>Rs. 186k</strong>
              </div>
            </div>
          </div>
        </section>
      </main>

      <section id="product" className="marketing-section">
        <div className="marketing-section-header">
          <span>Product</span>
          <h2>Built for the daily rhythm of construction sites.</h2>
        </div>
        <div className="marketing-card-grid">
          {productCards.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title}>
                <Icon size={24} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
        <div className="construction-image-grid">
          <figure>
            <Image
              src="/sitetrack-workflow-site.png"
              alt="Construction crew checking in at a site entrance with tablet attendance"
              width={1792}
              height={1024}
            />
            <figcaption>Morning check-in with site attendance controls.</figcaption>
          </figure>
          <figure>
            <Image
              src="/sitetrack-crew-panel.png"
              alt="Construction managers reviewing site records and payment visibility"
              width={1792}
              height={1024}
            />
            <figcaption>Site records, reports, and payment visibility in one review flow.</figcaption>
          </figure>
        </div>
      </section>

      <section id="workflow" className="marketing-section marketing-split">
        <div className="marketing-section-header">
          <span>Workflow</span>
          <h2>From morning attendance to payment review.</h2>
        </div>
        <div className="workflow-visual-stack">
          <Image
            src="/sitetrack-workflow-site.png"
            alt="Site supervisor recording crew attendance at a construction gate"
            width={1792}
            height={1024}
          />
          <div className="workflow-list">
            {workflowSteps.map((step, index) => (
              <div key={step}>
                <strong>{String(index + 1).padStart(2, '0')}</strong>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="marketing-section pricing-panel">
        <div>
          <span>Pricing</span>
          <h2>Simple workspace setup for construction teams.</h2>
          <p>Start with the core workforce, attendance, reporting, and payment visibility tools. Custom rollout support can be handled through JTK LABS.</p>
        </div>
        <Link href="/contact" className="btn btn-primary btn-large">Contact JTK LABS</Link>
      </section>

      <section id="about" className="marketing-section about-strip">
        <div className="landing-about-product">
          <div className="about-product-heading">
            <Image src="/sitetrack-mark.png" alt="" width={300} height={300} />
            <div>
              <h2>SiteTrack</h2>
              <p>A JTK LABS product</p>
            </div>
          </div>
          <p>
            SiteTrack is built for practical construction workforce management,
            daily attendance, site records, and payment clarity.
          </p>
          <div className="about-actions">
            <a href="https://jtklabs.net" target="_blank" rel="noreferrer" className="btn btn-outline btn-large">
              Visit JTK LABS
            </a>
            <Link href="/contact" className="btn btn-dark btn-large">
              Contact
            </Link>
          </div>
        </div>

        <aside className="connect-card landing-connect-card">
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
      </section>

      <footer className="about-footer">
        <span>© 2026 SiteTrack by JTK LABS. All rights reserved.</span>
        <nav aria-label="Contact">
          <Link href="/contact">Contact</Link>
        </nav>
      </footer>
    </div>
  );
}
