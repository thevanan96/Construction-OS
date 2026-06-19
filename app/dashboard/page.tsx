'use client';

import Link from 'next/link';
import type { ElementType } from 'react';
import { useApp } from '@/lib/store';
import { AlertTriangle, Banknote, Building, CalendarCheck, Clock, FileText, Plus, UserCheck, Wallet } from 'lucide-react';
import { calculateAttendanceRecordsEarnings, getAttendanceHours } from '@/lib/salary';

function formatNumber(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function DashboardPage() {
  const { employees, attendance, payments, sites } = useApp();

  const today = new Date().toISOString().split('T')[0];
  const todaysAttendance = attendance.filter((record) => record.date === today);
  const activeEmployeeRecords = employees.filter((employee) => employee.active);
  const employeeDayStats = activeEmployeeRecords.map((employee) => {
    const records = todaysAttendance.filter((record) => record.employeeId === employee.id);
    const hours = records.reduce((sum, record) => sum + getAttendanceHours(record), 0);
    const hasAbsentOnly = records.length > 0 && records.every((record) => record.status === 'absent');
    return { employee, hours, hasAbsentOnly, marked: records.length > 0 };
  });
  const presentToday = employeeDayStats.filter((item) => item.hours >= 10.5).length;
  const halfDayToday = employeeDayStats.filter((item) => item.hours > 0 && item.hours < 10.5).length;
  const absentToday = employeeDayStats.filter((item) => item.hasAbsentOnly).length;
  const totalHoursToday = todaysAttendance.reduce((sum, record) => sum + getAttendanceHours(record), 0);
  const markedToday = employeeDayStats.filter((item) => item.marked).length;
  const notMarkedToday = Math.max(0, activeEmployeeRecords.length - markedToday);
  const attendanceCompletion = activeEmployeeRecords.length
    ? Math.round((markedToday / activeEmployeeRecords.length) * 100)
    : 0;
  const totalEarnings = employees.reduce((acc, employee) => {
    const records = attendance.filter((record) => record.employeeId === employee.id);
    return acc + calculateAttendanceRecordsEarnings(employee, records);
  }, 0);

  const totalPaid = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const balanceDue = Math.max(0, totalEarnings - totalPaid);
  const activeSiteRecords = sites.filter((site) => (site.status || 'active') === 'active');
  const onHoldSites = sites.filter((site) => site.status === 'on-hold').length;
  const activeSites = activeSiteRecords.length;
  const activeEmployees = activeEmployeeRecords.length;
  const sitePulseRows = activeSiteRecords.slice(0, 4).map((site) => {
    const records = todaysAttendance.filter((record) => record.site === site.id);
    const workers = new Set(records.map((record) => record.employeeId)).size;
    const hours = records.reduce((sum, record) => sum + getAttendanceHours(record), 0);

    return { site, workers, hours };
  });
  const needsAttention = [
    {
      label: 'Unmarked attendance',
      value: notMarkedToday,
      detail: `${markedToday} of ${activeEmployees} active workers marked`,
      href: '/attendance',
      tone: notMarkedToday > 0 ? 'warning' : 'success',
    },
    {
      label: 'Absent today',
      value: absentToday,
      detail: `${halfDayToday} half-day records`,
      href: '/attendance',
      tone: absentToday > 0 ? 'danger' : 'success',
    },
    {
      label: 'Balance due',
      value: formatNumber(balanceDue),
      detail: `${formatNumber(totalPaid)} paid so far`,
      href: '/salary',
      tone: balanceDue > 0 ? 'danger' : 'success',
    },
  ];

  return (
    <div className="shell dashboard-page">
      <header className="page-header dashboard-header">
        <div>
          <div className="page-kicker">Today&apos;s operations</div>
          <h1 className="page-title">Workforce overview</h1>
          <p className="page-subtitle">Track attendance completion, active sites, and payment exposure for {today}.</p>
        </div>
        <div className="toolbar dashboard-actions">
          <Link href="/employees" className="btn btn-outline">
            <Plus size={18} />
            Employee
          </Link>
          <Link href="/attendance" className="btn btn-primary">
            <CalendarCheck size={18} />
            Mark Attendance
          </Link>
        </div>
      </header>

      <section className="dashboard-priority-panel mb-6">
        <div>
          <div className="page-kicker">Attendance completion</div>
          <h2>{attendanceCompletion}% marked</h2>
          <p>{markedToday} of {activeEmployees} active workers marked today</p>
        </div>
        <div className="dashboard-progress-track" aria-hidden="true">
          <div className="dashboard-progress-fill" style={{ width: `${attendanceCompletion}%` }} />
        </div>
        <div className="dashboard-priority-actions">
          <Link href="/attendance" className="btn btn-primary">
            <CalendarCheck size={17} />
            Continue Attendance
          </Link>
          <Link href="/reports" className="btn btn-outline">
            <FileText size={17} />
            Build Report
          </Link>
        </div>
      </section>

      <section className="metric-grid dashboard-metric-grid mb-6">
        <MetricCard
          title="Not Marked"
          value={notMarkedToday}
          note={`${markedToday} marked today`}
          icon={AlertTriangle}
          tone={notMarkedToday > 0 ? 'warning' : 'success'}
        />
        <MetricCard
          title="Present Today"
          value={presentToday}
          note={`${halfDayToday} half-day, ${absentToday} absent`}
          icon={UserCheck}
          tone="success"
        />
        <MetricCard
          title="Active Sites"
          value={activeSites}
          note={`${onHoldSites} on hold, ${sites.length} total`}
          icon={Building}
          tone="info"
        />
        <MetricCard
          title="Balance Due"
          value={formatNumber(balanceDue)}
          note={`${formatNumber(totalPaid)} paid across all records`}
          icon={Banknote}
          tone="danger"
        />
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="section-header mb-4">
            <div>
              <h2 className="text-xl font-bold">Today&apos;s Site Pulse</h2>
              <p className="page-subtitle">Active sites with workers and hours logged today</p>
            </div>
            <div className="soft-icon primary">
              <Clock size={20} />
            </div>
          </div>

          <div className="list-stack">
            <div className="detail-row">
              <span>Employees marked</span>
              <strong>{markedToday} / {activeEmployees}</strong>
            </div>
            <div className="detail-row">
              <span>Total hours logged</span>
              <strong>{totalHoursToday.toFixed(1)} hrs</strong>
            </div>
            <div className="detail-row">
              <span>Sites available</span>
              <strong>{sites.length}</strong>
            </div>
            <div className="divider" />
            {sitePulseRows.length === 0 ? (
              <div className="dashboard-empty-note">
                Add active sites to see today&apos;s site pulse.
              </div>
            ) : (
              <div className="dashboard-site-list">
                {sitePulseRows.map(({ site, workers, hours }) => (
                  <Link href="/sites" className="dashboard-site-row" key={site.id}>
                    <div>
                      <strong>{site.name}</strong>
                      <span>{site.location}</span>
                    </div>
                    <div>
                      <strong>{workers}</strong>
                      <span>{hours.toFixed(1)} hrs</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div className="divider" />
            <div className="toolbar">
              <Link href="/attendance" className="btn btn-primary">
                <CalendarCheck size={17} />
                Continue Attendance
              </Link>
              <Link href="/reports" className="btn btn-outline">
                <FileText size={17} />
                Build Report
              </Link>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="section-header mb-4">
            <div>
              <h2 className="text-xl font-bold">Needs Attention</h2>
              <p className="page-subtitle">The highest-priority follow-ups for today</p>
            </div>
            <div className="soft-icon warning">
              <AlertTriangle size={20} />
            </div>
          </div>

          <div className="dashboard-attention-list">
            {needsAttention.map((item) => (
              <Link href={item.href} className={`dashboard-attention-row ${item.tone}`} key={item.label}>
                <div>
                  <span>{item.label}</span>
                  <strong>{item.detail}</strong>
                </div>
                <strong>{item.value}</strong>
              </Link>
            ))}
            <div className="divider" />
            <div className="list-stack">
              <div className="detail-row">
                <span>Total earned</span>
                <strong>{formatNumber(totalEarnings)}</strong>
              </div>
              <div className="detail-row">
                <span>Total paid</span>
                <strong>{formatNumber(totalPaid)}</strong>
              </div>
              <Link href="/salary" className="btn btn-outline">
                <Wallet size={17} />
                Review Payments
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ title, value, note, icon: Icon, tone = 'default' }: {
  title: string;
  value: number | string;
  note: string;
  icon: ElementType;
  tone?: 'default' | 'success' | 'info' | 'danger' | 'warning';
}) {
  const iconClass = tone === 'danger' ? 'soft-icon danger' : tone === 'info' ? 'soft-icon info' : tone === 'success' ? 'soft-icon' : tone === 'warning' ? 'soft-icon warning' : 'soft-icon primary';

  return (
    <div className={`card metric-card card-interactive metric-card-${tone}`}>
      <div>
        <p className="metric-label">{title}</p>
        <p className="metric-value">{value}</p>
        <p className="metric-note">{note}</p>
      </div>
      <div className={iconClass}>
        <Icon size={21} />
      </div>
    </div>
  );
}
