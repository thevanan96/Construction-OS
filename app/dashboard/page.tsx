'use client';

import Link from 'next/link';
import type { ElementType } from 'react';
import { useApp } from '@/lib/store';
import { Banknote, Building, CalendarCheck, Clock, FileText, Plus, UserCheck, Users, Wallet } from 'lucide-react';
import { calculateAttendanceRecordsEarnings, getAttendanceHours } from '@/lib/salary';

function formatNumber(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function DashboardPage() {
  const { employees, attendance, payments, sites } = useApp();

  const today = new Date().toISOString().split('T')[0];
  const todaysAttendance = attendance.filter((record) => record.date === today);
  const employeeDayStats = employees.map((employee) => {
    const records = todaysAttendance.filter((record) => record.employeeId === employee.id);
    const hours = records.reduce((sum, record) => sum + getAttendanceHours(record), 0);
    const hasAbsentOnly = records.length > 0 && records.every((record) => record.status === 'absent');
    return { hours, hasAbsentOnly };
  });
  const presentToday = employeeDayStats.filter((item) => item.hours >= 10.5).length;
  const halfDayToday = employeeDayStats.filter((item) => item.hours > 0 && item.hours < 10.5).length;
  const absentToday = employeeDayStats.filter((item) => item.hasAbsentOnly).length;
  const totalHoursToday = todaysAttendance.reduce((sum, record) => sum + getAttendanceHours(record), 0);
  const markedToday = new Set(todaysAttendance.map((record) => record.employeeId)).size;

  const totalEarnings = employees.reduce((acc, employee) => {
    const records = attendance.filter((record) => record.employeeId === employee.id);
    return acc + calculateAttendanceRecordsEarnings(employee, records);
  }, 0);

  const totalPaid = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const balanceDue = Math.max(0, totalEarnings - totalPaid);
  const activeSites = sites.filter((site) => (site.status || 'active') === 'active').length;
  const activeEmployees = employees.filter((employee) => employee.active).length;

  return (
    <div className="shell">
      <header className="page-header">
        <div>
          <div className="page-kicker">Operations overview</div>
          <h1 className="page-title">Today&apos;s workforce command center</h1>
          <p className="page-subtitle">Track site staffing, attendance, and payment exposure from one clean view.</p>
        </div>
        <div className="toolbar">
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

      <section className="metric-grid mb-6">
        <MetricCard
          title="Active Workforce"
          value={activeEmployees}
          note={`${employees.length} total employee records`}
          icon={Users}
        />
        <MetricCard
          title="Present Today"
          value={presentToday}
          note={`${halfDayToday} half-day, ${absentToday} absent`}
          icon={UserCheck}
          tone="success"
        />
        <MetricCard
          title="Open Sites"
          value={activeSites}
          note={`${sites.length} total site records`}
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
              <p className="page-subtitle">Attendance progress for {today}</p>
            </div>
            <div className="soft-icon primary">
              <Clock size={20} />
            </div>
          </div>

          <div className="list-stack">
            <div className="detail-row">
              <span>Employees marked</span>
              <strong>{markedToday} / {employees.length}</strong>
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
              <h2 className="text-xl font-bold">Payment Snapshot</h2>
              <p className="page-subtitle">Current earnings and payment position</p>
            </div>
            <div className="soft-icon info">
              <Wallet size={20} />
            </div>
          </div>

          <div className="list-stack">
            <div className="detail-row">
              <span>Total earned</span>
              <strong>{formatNumber(totalEarnings)}</strong>
            </div>
            <div className="detail-row">
              <span>Total paid</span>
              <strong>{formatNumber(totalPaid)}</strong>
            </div>
            <div className="detail-row">
              <span>Balance due</span>
              <strong className={balanceDue > 0 ? 'text-danger' : ''}>{formatNumber(balanceDue)}</strong>
            </div>
            <div className="divider" />
            <Link href="/salary" className="btn btn-outline">
              <Banknote size={17} />
              Review Salary & Payments
            </Link>
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
  tone?: 'default' | 'success' | 'info' | 'danger';
}) {
  const iconClass = tone === 'danger' ? 'soft-icon danger' : tone === 'info' ? 'soft-icon info' : tone === 'success' ? 'soft-icon' : 'soft-icon primary';

  return (
    <div className="card metric-card card-interactive">
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
