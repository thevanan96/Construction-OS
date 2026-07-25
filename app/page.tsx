import Image from 'next/image';
import Link from 'next/link';
import { PublicHeader } from '@/components/PublicHeader';
import { LandingFaq } from '@/components/LandingFaq';
import {
  BadgeCheck,
  CalendarCheck,
  Check,
  ClipboardList,
  ExternalLink,
  FileSpreadsheet,
  HardHat,
  Linkedin,
  Mail,
  Phone,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';

const productCards = [
  {
    icon: Users,
    title: 'Crew directory',
    text: 'Keep worker profiles, roles, rates, contacts, and active status ready for every site day.',
  },
  {
    icon: CalendarCheck,
    title: 'Fast attendance',
    text: 'Mark present, absent, half-day, hours, and site assignment without chasing spreadsheets.',
  },
  {
    icon: Wallet,
    title: 'Payment clarity',
    text: 'See earned amounts, paid totals, and open balances before payroll decisions pile up.',
  },
];

const workflowSteps = [
  'Set up crews, roles, rates, and active sites',
  'Mark daily attendance from the Quick Mark workflow',
  'Review balances and record salary or advance payments',
  'Use reports to understand site labor cost',
];

const benefits = [
  {
    icon: FileSpreadsheet,
    title: 'No more spreadsheets',
    text: 'Crew records, attendance, and payments live in one workspace instead of scattered files.',
  },
  {
    icon: Wallet,
    title: 'Payment clarity',
    text: 'Earned, paid, and balance-due amounts stay visible before payroll decisions pile up.',
  },
  {
    icon: HardHat,
    title: 'Built for site operations',
    text: 'Quick Mark attendance and site assignment are designed for a supervisor on a job site, not a desk.',
  },
  {
    icon: Zap,
    title: 'Fast to roll out',
    text: 'Sign up, add your crew and sites, and start marking attendance the same day.',
  },
];

const pricingFeatures = [
  'Crew directory with roles, rates, and rate history',
  'Site-by-site attendance and daily hours',
  'Salary, advance, and bonus payment tracking',
  'Materials, equipment, and subcontractor expense logs',
  'Labor cost and expense reports by site and date range',
  'Payslip generation and CSV exports',
];

const faqItems = [
  {
    question: 'Who is FieldMetrik for?',
    answer: 'Construction business owners, supervisors, and site managers who need a simpler way to track crew records, daily attendance, and payments than spreadsheets or paper logs.',
  },
  {
    question: 'Do I need to install anything?',
    answer: 'No. FieldMetrik runs in your browser on desktop or mobile — create a workspace and you’re ready to go.',
  },
  {
    question: 'Is our data kept private?',
    answer: 'Yes. Each company workspace is isolated at the database level, so only your account can read or write your crew, attendance, and payment data.',
  },
  {
    question: 'How do we get started?',
    answer: 'Create a workspace, add your employees and sites, and start marking attendance from day one. Reach out to JTK LABS if you want help with setup or onboarding.',
  },
];

export default function LandingPage() {
  return (
    <div className="auth-landing marketing-home">
      <PublicHeader />

      <main className="marketing-hero">
        <section className="marketing-copy">
          <div className="hero-badge">
            <ClipboardList size={16} />
            FieldMetrik for construction teams
          </div>
          <h1>Modern workforce control for construction site operations.</h1>
          <p>
            FieldMetrik gives owners, supervisors, and site managers a cleaner way to manage crew records,
            daily attendance, site activity, and payment visibility from one professional workspace.
          </p>
          <div className="hero-actions">
            <Link href="/signup" className="btn btn-primary btn-large">Create workspace</Link>
            <a href="#workflow" className="btn btn-outline btn-large">See workflow</a>
          </div>
        </section>

        <section className="site-hero-visual" aria-label="Construction site operations preview">
          <Image
            src="/fieldmetrik-hero-site.png"
            alt="Construction site supervisors reviewing FieldMetrik operations on a tablet"
            width={1729}
            height={910}
            priority
          />
          <div className="site-hero-overlay">
            <div className="preview-topline">
              <span>Today&apos;s site pulse</span>
              <strong>Preview</strong>
            </div>
            <div className="preview-metrics">
              <div>
                <span>Active crew</span>
                <strong>48</strong>
              </div>
              <div>
                <span>Attendance</span>
                <strong>91%</strong>
              </div>
              <div>
                <span>Open balance</span>
                <strong>Rs. 186k</strong>
              </div>
            </div>
            <p className="preview-sample-note">Sample data for illustration</p>
          </div>
        </section>
      </main>

      <section id="product" className="marketing-section">
        <div className="marketing-section-header">
          <span>Product</span>
          <h2>A focused SaaS workspace for daily construction operations.</h2>
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
              src="/fieldmetrik-workflow-site.png"
              alt="Construction crew checking in at a site entrance with tablet attendance"
              width={1754}
              height={896}
            />
            <figcaption>Morning attendance with site-ready controls.</figcaption>
          </figure>
          <figure>
            <Image
              src="/fieldmetrik-crew-panel.png"
              alt="Construction managers reviewing site records and payment visibility"
              width={1536}
              height={1024}
            />
            <figcaption>Workforce, reports, and payment visibility in one review flow.</figcaption>
          </figure>
        </div>
      </section>

      <section className="marketing-section benefits-strip">
        <div className="marketing-section-header">
          <span>Why FieldMetrik</span>
          <h2>Practical tools built for how construction teams actually work.</h2>
        </div>
        <div className="benefits-grid">
          {benefits.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="benefit-card">
                <div className="benefit-icon">
                  <Icon size={22} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="workflow" className="marketing-section marketing-split">
        <div className="marketing-section-header">
          <span>Workflow</span>
          <h2>From morning site check-in to payment review.</h2>
        </div>
        <div className="workflow-visual-stack">
          <Image
            src="/fieldmetrik-workflow-site.png"
            alt="Site supervisor recording crew attendance at a construction gate"
            width={1754}
            height={896}
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
        <div className="marketing-section-header">
          <span>Pricing</span>
          <h2>Simple workspace rollout for construction teams.</h2>
          <p>Start with the core workforce, attendance, reports, and payment visibility tools. For larger teams, JTK LABS can help with setup, onboarding, and workflow adaptation.</p>
        </div>
        <div className="pricing-card">
          <div className="pricing-card-heading">
            <BadgeCheck size={22} />
            <span>What&apos;s included</span>
          </div>
          <ul className="pricing-feature-list">
            {pricingFeatures.map((feature) => (
              <li key={feature}>
                <Check size={16} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <Link href="/contact" className="btn btn-primary btn-large btn-block">Talk to JTK LABS</Link>
        </div>
      </section>

      <section className="marketing-section landing-faq-section">
        <div className="marketing-section-header">
          <span>FAQ</span>
          <h2>Common questions about FieldMetrik.</h2>
        </div>
        <LandingFaq items={faqItems} />
      </section>

      <section id="about" className="marketing-section about-strip">
        <div className="landing-about-product">
          <div className="about-product-heading">
            <Image src="/fieldmetrik-mark.png" alt="" width={300} height={300} />
            <div>
              <h2>FieldMetrik</h2>
              <p>A JTK LABS product</p>
            </div>
          </div>
          <p>
            FieldMetrik is built for practical construction workforce management,
            daily attendance, site records, reports, and payment clarity.
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
        <span>© 2026 FieldMetrik by JTK LABS. All rights reserved.</span>
        <nav aria-label="Contact">
          <Link href="/contact">Contact</Link>
        </nav>
      </footer>
    </div>
  );
}
