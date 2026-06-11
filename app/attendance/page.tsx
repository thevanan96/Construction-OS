'use client';

import { useState } from 'react';
import type { ElementType } from 'react';
import { useApp } from '@/lib/store';
import { CalendarDays, ChevronLeft, ChevronRight, Check, Clock, Search, Timer, UserCheck, X } from 'lucide-react';
import { AttendanceStatus } from '@/lib/types';
import { getSriLankaDate } from '@/lib/dateUtils';

// Helper to get applicable rate for a specific date from history (Same as SalaryPage)
const getRateForDate = (baseRate: number, history: { rate: number; effectiveDate: string }[] | undefined, date: string) => {
    if (!history || history.length === 0) return baseRate;
    const sorted = [...history].sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
    const targetDate = new Date(date);
    const applicableEntry = sorted.find(h => new Date(h.effectiveDate) <= targetDate);
    return applicableEntry ? applicableEntry.rate : baseRate;
};

export default function AttendancePage() {
    const { employees, attendance, markAttendance, sites } = useApp();
    const [selectedDate, setSelectedDate] = useState(getSriLankaDate());
    const [searchQuery, setSearchQuery] = useState('');
    const [employeeSites, setEmployeeSites] = useState<Record<string, string>>({});
    const [employeeRoles, setEmployeeRoles] = useState<Record<string, string>>({});

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const todaysRecords = attendance.filter(a => a.date === selectedDate);
    const markedCount = todaysRecords.length;
    const presentCount = todaysRecords.filter(a => a.status === 'present').length;
    const halfDayCount = todaysRecords.filter(a => a.status === 'half-day').length;
    const absentCount = todaysRecords.filter(a => a.status === 'absent').length;
    const totalHours = todaysRecords.reduce((sum, record) => sum + (record.workingHours || 0), 0);
    const completionPercent = employees.length ? Math.round((markedCount / employees.length) * 100) : 0;

    const handleDateChange = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
        setEmployeeSites({});
        setEmployeeRoles({});
    };

    const handleSelectedDateChange = (date: string) => {
        setSelectedDate(date);
        setEmployeeSites({});
        setEmployeeRoles({});
    };

    const getRecord = (employeeId: string) => {
        return attendance.find(a => a.employeeId === employeeId && a.date === selectedDate);
    };

    const getSite = (employeeId: string): string => {
        const record = getRecord(employeeId);
        if (record && record.site) return record.site;
        return employeeSites[employeeId] || (sites.length > 0 ? sites[0].id : '');
    };

    const getRole = (employeeId: string, defaultRole: string): string => {
        const record = getRecord(employeeId);
        if (record && record.role) return record.role;
        return employeeRoles[employeeId] || defaultRole;
    };

    const calculateHours = (start: string, end: string): number => {
        if (!start || !end) return 0;
        const startDate = new Date(`1970-01-01T${start}`);
        const endDate = new Date(`1970-01-01T${end}`);
        const diff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
        return diff > 0 ? parseFloat(diff.toFixed(2)) : 0;
    };

    const setStatus = (employeeId: string, status: AttendanceStatus) => {
        const currentSite = employeeSites[employeeId] || (sites.length > 0 ? sites[0].id : '');
        const employee = employees.find(e => e.id === employeeId);
        const currentRole = employeeRoles[employeeId] || employee?.role || '';

        let startTime = '';
        let endTime = '';
        let workingHours = 0;

        if (status === 'present') {
            startTime = '08:00';
            endTime = '18:00';
            workingHours = 10;
        } else if (status === 'half-day') {
            startTime = '08:00';
            endTime = '13:00';
            workingHours = 5;
        } else {
            // Absent
            startTime = '';
            endTime = '';
            workingHours = 0;
        }

        markAttendance({
            employeeId,
            date: selectedDate,
            status,
            role: currentRole,
            site: currentSite || undefined,
            startTime,
            endTime,
            workingHours
        });
    };

    const handleTimeChange = (employeeId: string, field: 'startTime' | 'endTime', value: string) => {
        const record = getRecord(employeeId);
        const currentSite = getSite(employeeId);
        const employee = employees.find(e => e.id === employeeId);
        const currentRole = getRole(employeeId, employee?.role || '');

        const currentStart = field === 'startTime' ? value : (record?.startTime || '');
        const currentEnd = field === 'endTime' ? value : (record?.endTime || '');

        const hours = calculateHours(currentStart, currentEnd);

        // Auto-determine status based on hours
        let status: AttendanceStatus = 'absent';
        if (hours >= 10) status = 'present';
        else if (hours > 0) status = 'half-day';

        markAttendance({
            employeeId,
            date: selectedDate,
            status,
            role: currentRole,
            site: currentSite || undefined,
            startTime: currentStart,
            endTime: currentEnd,
            workingHours: hours
        });
    };

    const handleSiteChange = (employeeId: string, siteId: string) => {
        setEmployeeSites(prev => ({ ...prev, [employeeId]: siteId }));
        const record = getRecord(employeeId);

        if (record) {
            markAttendance({
                employeeId,
                date: selectedDate,
                status: record.status,
                site: siteId || undefined,
                startTime: record.startTime,
                endTime: record.endTime,
                workingHours: record.workingHours
            });
        }
    };

    const handleRoleChange = (employeeId: string, role: string) => {
        setEmployeeRoles(prev => ({ ...prev, [employeeId]: role }));

        // If record exists, update it immediately
        const record = getRecord(employeeId);
        if (record) {
            markAttendance({
                employeeId,
                date: selectedDate,
                status: record.status,
                role: role,
                site: record.site,
                startTime: record.startTime,
                endTime: record.endTime,
                workingHours: record.workingHours
            });
        }
    };

    return (
        <div className="shell">
            <div className="page-header flex-col md:flex-row gap-4 items-start md:items-end">
                <div>
                    <div className="page-kicker">Daily log</div>
                    <h1 className="page-title">Attendance</h1>
                    <p className="page-subtitle">Mark roles, sites, hours, and status for each worker.</p>
                </div>

                <div className="toolbar">
                    <div className="search-box">
                        <Search className="text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search employee..."
                            className="input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="date-control">
                        <button onClick={() => handleDateChange(-1)} className="icon-button" type="button" aria-label="Previous day">
                            <ChevronLeft size={20} />
                        </button>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => handleSelectedDateChange(e.target.value)}
                            className="input"
                        />
                        <button onClick={() => handleDateChange(1)} className="icon-button" type="button" aria-label="Next day">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="attendance-summary">
                <div className="attendance-focus">
                    <div className="flex justify-between items-start gap-4 mb-4">
                        <div>
                            <div className="page-kicker">Completion</div>
                            <h2 className="text-xl font-bold">{completionPercent}% marked</h2>
                            <p className="page-subtitle">{markedCount} of {employees.length} employees recorded for {selectedDate}</p>
                        </div>
                        <div className="soft-icon">
                            <CalendarDays size={20} />
                        </div>
                    </div>
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${completionPercent}%` }} />
                    </div>
                </div>
                <AttendanceStat label="Present" value={presentCount} icon={UserCheck} tone="success" />
                <AttendanceStat label="Half Day" value={halfDayCount} icon={Clock} tone="warning" />
                <AttendanceStat label="Absent" value={absentCount} icon={X} tone="danger" />
                <AttendanceStat label="Hours" value={totalHours.toFixed(1)} icon={Timer} tone="info" />
            </div>

            <div className="dashboard-grid">
                {filteredEmployees.length === 0 ? (
                    <div className="empty-state col-span-full">
                        <div>
                            <Search size={44} className="mx-auto" />
                                            <h3>{searchQuery ? 'No matching employees' : 'No employees yet'}</h3>
                                            <p>{searchQuery ? 'Try a different name.' : 'Add employees before marking attendance.'}</p>
                        </div>
                    </div>
                ) : (
                    filteredEmployees.map(emp => {
                        const record = getRecord(emp.id);
                        const status = record?.status;
                        const currentSiteId = getSite(emp.id);
                        const startTime = record?.startTime || '';
                        const endTime = record?.endTime || '';
                        const workingHours = record?.workingHours || 0;

                        // Determine role and rate
                        const currentRole = employeeRoles[emp.id] || (record?.role || emp.role);

                        // 1. Get Base Rate and History for the Role
                        let baseRate = emp.dailyRate;
                        let rateHistory = emp.rateHistory;

                        if (currentRole !== emp.role) {
                            const roleData = emp.additionalRoles?.find(r => r.role === currentRole);
                            if (roleData) {
                                baseRate = roleData.dailyRate;
                                rateHistory = roleData.rateHistory;
                            }
                        }

                        // 2. Get Effective Rate for selected Date
                        const effectiveRate = getRateForDate(baseRate, rateHistory, selectedDate);

                        return (
                            <div key={emp.id} className="card attendance-card card-interactive">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-[var(--color-dark)] truncate">{emp.name}</h3>
                                            {workingHours > 0 && (
                                                <span className="badge">
                                                    {workingHours}h
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 flex flex-wrap items-center gap-2 mt-1">
                                            {emp.additionalRoles && emp.additionalRoles.length > 0 ? (
                                                <select
                                                    value={currentRole}
                                                    onChange={(e) => handleRoleChange(emp.id, e.target.value)}
                                                    className="input"
                                                    style={{ minHeight: 28, padding: '0 28px 0 8px', fontSize: '0.78rem' }}
                                                >
                                                    <option value={emp.role}>{emp.role}</option>
                                                    {emp.additionalRoles.map(r => (
                                                        <option key={r.role} value={r.role}>{r.role}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="badge">{emp.role}</span>
                                            )}
                                            <span className="font-mono text-blue-600 font-bold">Rate {effectiveRate}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="attendance-field-label">Assigned Site</div>
                                    <select
                                        className="input"
                                        value={currentSiteId}
                                        onChange={(e) => handleSiteChange(emp.id, e.target.value)}
                                    >
                                        <option value="">No Site</option>
                                        {sites.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="relative">
                                        <div className="attendance-field-label">Start</div>
                                        <input
                                            type="time"
                                            className="input text-center"
                                            value={startTime}
                                            onChange={(e) => handleTimeChange(emp.id, 'startTime', e.target.value)}
                                        />
                                    </div>
                                    <div className="relative">
                                        <div className="attendance-field-label">End</div>
                                        <input
                                            type="time"
                                            className="input text-center"
                                            value={endTime}
                                            onChange={(e) => handleTimeChange(emp.id, 'endTime', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="attendance-actions">
                                    <button
                                        onClick={() => setStatus(emp.id, 'present')}
                                        className={`btn btn-attendance ${status === 'present' ? 'active-present' : ''}`}
                                        title="10h Shift"
                                    >
                                        <Check size={14} />
                                        <span>10h</span>
                                    </button>

                                    <button
                                        onClick={() => setStatus(emp.id, 'half-day')}
                                        className={`btn btn-attendance ${status === 'half-day' ? 'active-halfday' : ''}`}
                                        title="5h Shift"
                                    >
                                        <Clock size={14} />
                                        <span>5h</span>
                                    </button>

                                    <button
                                        onClick={() => setStatus(emp.id, 'absent')}
                                        className={`btn btn-attendance ${status === 'absent' ? 'active-absent' : ''}`}
                                        title="Reset"
                                    >
                                        <X size={14} />
                                        <span>Reset</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div >
        </div >
    );
}

function AttendanceStat({ label, value, icon: Icon, tone }: {
    label: string;
    value: string | number;
    icon: ElementType;
    tone: 'success' | 'warning' | 'danger' | 'info';
}) {
    const className = tone === 'danger' ? 'soft-icon danger' : tone === 'info' ? 'soft-icon info' : tone === 'warning' ? 'soft-icon primary' : 'soft-icon';

    return (
        <div className="insight-card">
            <div>
                <span>{label}</span>
                <strong>{value}</strong>
            </div>
            <div className={className}>
                <Icon size={20} />
            </div>
        </div>
    );
}
