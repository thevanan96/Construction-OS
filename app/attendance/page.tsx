'use client';

import { useState } from 'react';
import type { ElementType, FormEvent } from 'react';
import { useApp } from '@/lib/store';
import { BadgeDollarSign, CalendarDays, ChevronLeft, ChevronRight, Check, Clock, Plus, Search, Timer, Trash2, UserCheck, X } from 'lucide-react';
import { Attendance, AttendanceStatus, Employee } from '@/lib/types';
import { getSriLankaDate } from '@/lib/dateUtils';
import { getApplicableDailyRate, getAttendanceHours } from '@/lib/salary';

const calculateHours = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(`1970-01-01T${start}`);
    const endDate = new Date(`1970-01-01T${end}`);
    const diff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    return diff > 0 ? parseFloat(diff.toFixed(2)) : 0;
};

const statusFromHours = (hours: number): AttendanceStatus => {
    if (hours >= 10.5) return 'present';
    if (hours > 0) return 'half-day';
    return 'absent';
};

const getRoleOptions = (employee: Employee) => [
    employee.role,
    ...(employee.additionalRoles || []).map(role => role.role),
];

const getStatusMeta = (records: Attendance[], totalHours: number) => {
    if (records.length === 0) {
        return {
            label: 'Not Marked',
            className: 'attendance-status-badge',
            cardClassName: 'attendance-card-not-marked'
        };
    }
    if (records.every(record => record.status === 'absent')) {
        return {
            label: 'Absent',
            className: 'attendance-status-badge attendance-status-absent',
            cardClassName: 'attendance-card-absent'
        };
    }
    if (totalHours >= 10.5) {
        return {
            label: 'Present',
            className: 'attendance-status-badge attendance-status-present',
            cardClassName: 'attendance-card-present'
        };
    }
    if (totalHours > 0) {
        return {
            label: 'Half Day',
            className: 'attendance-status-badge attendance-status-half-day',
            cardClassName: 'attendance-card-half-day'
        };
    }

    return {
        label: 'Not Marked',
        className: 'attendance-status-badge',
        cardClassName: 'attendance-card-not-marked'
    };
};

export default function AttendancePage() {
    const { employees, attendance, payments, markAttendance, addAttendanceSegment, updateAttendanceSegment, deleteAttendanceSegment, addPayment, deletePayment, sites } = useApp();
    const [selectedDate, setSelectedDate] = useState(getSriLankaDate());
    const [searchQuery, setSearchQuery] = useState('');
    const [employeeSites, setEmployeeSites] = useState<Record<string, string>>({});
    const [employeeRoles, setEmployeeRoles] = useState<Record<string, string>>({});
    const [advanceAmounts, setAdvanceAmounts] = useState<Record<string, string>>({});

    const activeEmployees = employees.filter(emp => emp.active);
    const filteredEmployees = activeEmployees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const todaysRecords = attendance.filter(a => a.date === selectedDate);
    const activeEmployeeIds = new Set(activeEmployees.map(employee => employee.id));
    const activeTodaysRecords = todaysRecords.filter(record => activeEmployeeIds.has(record.employeeId));
    const activeSites = sites.filter(site => (site.status || 'active') === 'active');
    const markedEmployeeIds = new Set(activeTodaysRecords.map(record => record.employeeId));
    const markedCount = markedEmployeeIds.size;
    const employeeDayStats = activeEmployees.map(employee => {
        const records = activeTodaysRecords.filter(record => record.employeeId === employee.id);
        const hours = records.reduce((sum, record) => sum + getAttendanceHours(record), 0);
        const hasAbsentOnly = records.length > 0 && records.every(record => record.status === 'absent');
        return { employeeId: employee.id, hours, hasAbsentOnly };
    });
    const presentCount = employeeDayStats.filter(item => item.hours >= 10.5).length;
    const halfDayCount = employeeDayStats.filter(item => item.hours > 0 && item.hours < 10.5).length;
    const absentCount = employeeDayStats.filter(item => item.hasAbsentOnly).length;
    const totalHours = activeTodaysRecords.reduce((sum, record) => sum + getAttendanceHours(record), 0);
    const completionPercent = activeEmployees.length ? Math.round((markedCount / activeEmployees.length) * 100) : 0;

    const handleDateChange = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
        setEmployeeSites({});
        setEmployeeRoles({});
        setAdvanceAmounts({});
    };

    const handleSelectedDateChange = (date: string) => {
        setSelectedDate(date);
        setEmployeeSites({});
        setEmployeeRoles({});
        setAdvanceAmounts({});
    };

    const getRecords = (employeeId: string) => {
        return attendance
            .filter(a => a.employeeId === employeeId && a.date === selectedDate)
            .sort((a, b) => (a.createdAt || a.id).localeCompare(b.createdAt || b.id));
    };

    const getSelectedSite = (employeeId: string): string => {
        return employeeSites[employeeId] || (activeSites.length > 0 ? activeSites[0].id : '');
    };

    const getSiteOptions = (currentSiteId?: string) => {
        const currentSite = currentSiteId ? sites.find(site => site.id === currentSiteId) : undefined;

        if (currentSite && !activeSites.some(site => site.id === currentSite.id)) {
            return [...activeSites, currentSite];
        }

        return activeSites;
    };

    const getSelectedRole = (employee: Employee): string => {
        return employeeRoles[employee.id] || employee.role;
    };

    const setStatus = (employee: Employee, status: AttendanceStatus) => {
        const currentSite = getSelectedSite(employee.id);
        const currentRole = getSelectedRole(employee);

        let startTime = '';
        let endTime = '';
        let workingHours = 0;

        if (status === 'present') {
            startTime = '08:00';
            endTime = '18:30';
            workingHours = 10.5;
        } else if (status === 'half-day') {
            startTime = '08:00';
            endTime = '13:00';
            workingHours = 5;
        }

        markAttendance({
            employeeId: employee.id,
            date: selectedDate,
            status,
            role: status === 'absent' ? undefined : currentRole,
            site: status === 'absent' ? undefined : currentSite || undefined,
            startTime,
            endTime,
            workingHours
        });
    };

    const addSegment = (employee: Employee) => {
        const currentRole = getSelectedRole(employee);
        const currentSite = getSelectedSite(employee.id);

        addAttendanceSegment({
            employeeId: employee.id,
            date: selectedDate,
            status: 'half-day',
            role: currentRole,
            site: currentSite || undefined,
            startTime: '08:00',
            endTime: '13:00',
            workingHours: 5
        });
    };

    const updateSegmentTime = (record: Attendance, field: 'startTime' | 'endTime', value: string) => {
        const startTime = field === 'startTime' ? value : (record.startTime || '');
        const endTime = field === 'endTime' ? value : (record.endTime || '');
        const workingHours = calculateHours(startTime, endTime);

        updateAttendanceSegment(record.id, {
            startTime,
            endTime,
            workingHours,
            status: statusFromHours(workingHours)
        });
    };

    const updateSegmentRole = (record: Attendance, role: string) => {
        updateAttendanceSegment(record.id, { role });
    };

    const updateSegmentSite = (record: Attendance, site: string) => {
        updateAttendanceSegment(record.id, { site: site || undefined });
    };

    const recordAdvancePayment = async (event: FormEvent, employee: Employee) => {
        event.preventDefault();

        const amount = Number(advanceAmounts[employee.id]);
        if (!amount || amount <= 0) return;

        await addPayment({
            employeeId: employee.id,
            amount,
            date: selectedDate,
            type: 'advance',
            notes: 'Advance Payment'
        });

        setAdvanceAmounts(prev => ({ ...prev, [employee.id]: '' }));
    };

    const deleteAdvancePayments = async (employee: Employee, paymentIds: string[]) => {
        if (paymentIds.length === 0) return;

        const message = paymentIds.length > 1
            ? `Delete all advance payments for ${employee.name} on ${selectedDate}?`
            : `Delete advance payment for ${employee.name} on ${selectedDate}?`;

        if (!confirm(message)) return;

        await Promise.all(paymentIds.map(paymentId => deletePayment(paymentId)));
    };

    return (
        <div className="shell attendance-page">
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
                            <p className="page-subtitle">{markedCount} of {activeEmployees.length} active employees recorded for {selectedDate}</p>
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

            <div className="attendance-grid">
                {filteredEmployees.length === 0 ? (
                    <div className="empty-state col-span-full">
                        <div>
                            <Search size={44} className="mx-auto" />
                            <h3>{searchQuery ? 'No matching active employees' : 'No active employees'}</h3>
                            <p>{searchQuery ? 'Try a different name.' : 'Reactivate or add employees before marking attendance.'}</p>
                        </div>
                    </div>
                ) : (
                    filteredEmployees.map(emp => {
                        const records = getRecords(emp.id);
                        const workRecords = records.filter(record => record.status !== 'absent');
                        const totalEmployeeHours = records.reduce((sum, record) => sum + getAttendanceHours(record), 0);
                        const selectedRole = getSelectedRole(emp);
                        const selectedSite = getSelectedSite(emp.id);
                        const effectiveRate = getApplicableDailyRate(emp, selectedRole, selectedDate);
                        const roleOptions = getRoleOptions(emp);
                        const statusMeta = getStatusMeta(records, totalEmployeeHours);
                        const isAbsentOnly = records.length > 0 && records.every(record => record.status === 'absent');
                        const paidAdvancePayments = payments.filter(payment =>
                            payment.employeeId === emp.id && payment.date === selectedDate && payment.type === 'advance'
                        );
                        const paidAdvance = paidAdvancePayments.reduce((sum, payment) => sum + payment.amount, 0);

                        return (
                            <div key={emp.id} className={`card attendance-card card-interactive ${statusMeta.cardClassName}`}>
                                <div className="attendance-card-header">
                                    <div className="min-w-0">
                                        <h3>{emp.name}</h3>
                                        <div className="attendance-card-meta">
                                            <span>{emp.role}</span>
                                            <span className="attendance-rate-muted">Rate {effectiveRate}</span>
                                        </div>
                                    </div>
                                    <div className="attendance-card-badges">
                                        <span className="badge">{totalEmployeeHours.toFixed(1)}h</span>
                                        <span className={statusMeta.className}>{statusMeta.label}</span>
                                    </div>
                                </div>

                                <div className="attendance-card-controls">
                                    <label>
                                        <span>Role</span>
                                        <select
                                            value={selectedRole}
                                            onChange={(e) => setEmployeeRoles(prev => ({ ...prev, [emp.id]: e.target.value }))}
                                            className="input"
                                        >
                                            {roleOptions.map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label>
                                        <span>Site</span>
                                        <select
                                            className="input"
                                            value={selectedSite}
                                            onChange={(e) => setEmployeeSites(prev => ({ ...prev, [emp.id]: e.target.value }))}
                                        >
                                            <option value="">No Site</option>
                                            {activeSites.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>

                                <div className="attendance-quick-actions">
                                    <button
                                        onClick={() => setStatus(emp, 'present')}
                                        className={`btn btn-attendance ${totalEmployeeHours >= 10.5 ? 'active-present' : ''}`}
                                        title="Full Day"
                                    >
                                        <Check size={14} />
                                        <span>Full Day</span>
                                    </button>

                                    <button
                                        onClick={() => setStatus(emp, 'half-day')}
                                        className={`btn btn-attendance ${totalEmployeeHours > 0 && totalEmployeeHours < 10.5 ? 'active-halfday' : ''}`}
                                        title="Half Day"
                                    >
                                        <Clock size={14} />
                                        <span>Half Day</span>
                                    </button>

                                    <button
                                        onClick={() => setStatus(emp, 'absent')}
                                        className={`btn btn-attendance ${isAbsentOnly ? 'active-absent' : ''}`}
                                        title="Reset"
                                    >
                                        <X size={14} />
                                        <span>Reset</span>
                                    </button>
                                </div>

                                {workRecords.length > 0 && (
                                    <div className="attendance-segments-clean">
                                        <div className="attendance-segments-title">
                                            <span>Work Segments</span>
                                            <strong>{workRecords.length}</strong>
                                        </div>
                                        {workRecords.map(record => {
                                            const recordRole = record.role || emp.role;
                                            const recordRate = getApplicableDailyRate(emp, recordRole, record.date);
                                            return (
                                                <div key={record.id} className="attendance-segment-clean">
                                                    <div className="attendance-segment-grid">
                                                        <select
                                                            className="input"
                                                            value={recordRole}
                                                            onChange={(e) => updateSegmentRole(record, e.target.value)}
                                                            aria-label={`${emp.name} segment role`}
                                                        >
                                                            {roleOptions.map(role => (
                                                                <option key={role} value={role}>{role}</option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            className="input"
                                                            value={record.site || ''}
                                                            onChange={(e) => updateSegmentSite(record, e.target.value)}
                                                            aria-label={`${emp.name} segment site`}
                                                        >
                                                            <option value="">No Site</option>
                                                            {getSiteOptions(record.site).map(s => (
                                                                <option key={s.id} value={s.id}>{s.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="attendance-segment-grid attendance-segment-time-grid">
                                                        <input
                                                            type="time"
                                                            className="input text-center"
                                                            value={record.startTime || ''}
                                                            onChange={(e) => updateSegmentTime(record, 'startTime', e.target.value)}
                                                            aria-label={`${emp.name} segment start time`}
                                                        />
                                                        <input
                                                            type="time"
                                                            className="input text-center"
                                                            value={record.endTime || ''}
                                                            onChange={(e) => updateSegmentTime(record, 'endTime', e.target.value)}
                                                            aria-label={`${emp.name} segment end time`}
                                                        />
                                                        <span className="segment-hours">{getAttendanceHours(record).toFixed(1)}h</span>
                                                        <button
                                                            className="icon-button attendance-delete-segment"
                                                            type="button"
                                                            title="Delete segment"
                                                            onClick={() => deleteAttendanceSegment(record.id)}
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                    <div className="attendance-rate-muted">Segment rate {recordRate}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <button
                                    className="btn btn-outline attendance-add-segment"
                                    type="button"
                                    onClick={() => addSegment(emp)}
                                >
                                    <Plus size={16} />
                                    Add Segment
                                </button>

                                <form className="attendance-advance-form" onSubmit={(event) => recordAdvancePayment(event, emp)}>
                                    <div className="attendance-advance-entry">
                                        <label>
                                            <span>Advance</span>
                                            <input
                                                type="number"
                                                className="input"
                                                placeholder="0.00"
                                                value={advanceAmounts[emp.id] || ''}
                                                onChange={(e) => setAdvanceAmounts(prev => ({ ...prev, [emp.id]: e.target.value }))}
                                                min="1"
                                                step="1"
                                            />
                                        </label>
                                        <button className="btn btn-outline attendance-advance-button" type="submit">
                                            <BadgeDollarSign size={16} />
                                            Paid
                                        </button>
                                    </div>
                                    {paidAdvance > 0 && (
                                        <div className="attendance-advance-paid">
                                            <div className="attendance-advance-paid-copy">
                                                <span>Paid advance</span>
                                                <strong>{paidAdvance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
                                            </div>
                                            <button
                                                className="icon-button attendance-advance-delete"
                                                type="button"
                                                title="Delete advance payment"
                                                onClick={() => deleteAdvancePayments(emp, paidAdvancePayments.map(payment => payment.id))}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </form>
                            </div>
                        );
                    })
                )}
            </div >
        </div >
    );
}

function AttendanceStat({ label, value, icon: Icon, tone }: {
    label: string | number;
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
