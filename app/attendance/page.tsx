'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { ChevronLeft, ChevronRight, Check, X, Clock, Search } from 'lucide-react';
import { AttendanceStatus } from '@/lib/types';
import { getSriLankaDate } from '@/lib/dateUtils';

export default function AttendancePage() {
    const { employees, attendance, markAttendance, sites } = useApp();
    const [selectedDate, setSelectedDate] = useState(getSriLankaDate());
    const [searchQuery, setSearchQuery] = useState('');
    const [employeeSites, setEmployeeSites] = useState<Record<string, string>>({});
    const [employeeRoles, setEmployeeRoles] = useState<Record<string, string>>({});

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDateChange = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
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
        <div>
            <div className="page-header flex-col md:flex-row gap-4 items-start md:items-end">
                <div>
                    <h1 className="page-title">Attendance</h1>
                    <p className="page-subtitle">Mark daily attendance & hours</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search employee..."
                            className="input pl-10 py-2 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-[var(--color-border)] shadow-sm">
                        <button onClick={() => handleDateChange(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                            <ChevronLeft size={20} />
                        </button>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="border-none font-medium focus:outline-none bg-transparent"
                        />
                        <button onClick={() => handleDateChange(1)} className="p-2 hover:bg-gray-100 rounded-full">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                {filteredEmployees.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 col-span-full">
                        {searchQuery ? 'No employees found matching your search.' : 'No employees found. Add employees first.'}
                    </div>
                ) : (
                    filteredEmployees.map(emp => {
                        const record = getRecord(emp.id);
                        const status = record?.status;
                        const currentSiteId = getSite(emp.id);
                        const startTime = record?.startTime || '';
                        const endTime = record?.endTime || '';
                        const workingHours = record?.workingHours || 0;

                        const currentRole = getRole(emp.id, emp.role);
                        const currentRate = emp.additionalRoles?.find(r => r.role === currentRole)?.dailyRate ?? emp.dailyRate;

                        return (
                            <div key={emp.id} className="card">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-[var(--color-dark)]">{emp.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-[var(--color-text-muted)]">{currentRole}</p>
                                            {workingHours > 0 && (
                                                <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                                    {workingHours} Hours
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                                        ${currentRate}/day
                                    </div>
                                </div>

                                {/* Role Selection (Only if multiple roles exist) */}
                                {emp.additionalRoles && emp.additionalRoles.length > 0 && (
                                    <div className="mb-4">
                                        <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase mb-1 block">Role</label>
                                        <select
                                            className="input text-sm p-2 w-full"
                                            value={currentRole}
                                            onChange={(e) => handleRoleChange(emp.id, e.target.value)}
                                        >
                                            <option value={emp.role}>{emp.role} (Primary - ${emp.dailyRate})</option>
                                            {emp.additionalRoles.map((r, idx) => (
                                                <option key={idx} value={r.role}>{r.role} - ${r.dailyRate}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="mb-4">
                                    <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase mb-1 block">Work Site</label>
                                    <select
                                        className="input text-sm p-2"
                                        value={currentSiteId}
                                        onChange={(e) => handleSiteChange(emp.id, e.target.value)}
                                    >
                                        <option value="">No Specific Site</option>
                                        {sites.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Custom Time Inputs */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1 block">Start Time</label>
                                        <input
                                            type="time"
                                            className="input text-xs p-1"
                                            value={startTime}
                                            onChange={(e) => handleTimeChange(emp.id, 'startTime', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1 block">End Time</label>
                                        <input
                                            type="time"
                                            className="input text-xs p-1"
                                            value={endTime}
                                            onChange={(e) => handleTimeChange(emp.id, 'endTime', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => setStatus(emp.id, 'present')}
                                        className="btn"
                                        style={{
                                            padding: '0.5rem',
                                            flexDirection: 'column',
                                            backgroundColor: status === 'present' ? 'var(--color-success-bg)' : 'transparent',
                                            border: status === 'present' ? '1px solid var(--color-success)' : '1px solid var(--color-border)',
                                            color: status === 'present' ? 'var(--color-success)' : 'var(--color-text-muted)',
                                            opacity: status === 'present' ? 1 : 0.7
                                        }}
                                        title="Shift: 08:00 - 18:00 (10h)"
                                    >
                                        <Check size={20} className="mb-1" />
                                        <span className="text-xs font-medium">10 Hr</span>
                                    </button>

                                    <button
                                        onClick={() => setStatus(emp.id, 'half-day')}
                                        className="btn"
                                        style={{
                                            padding: '0.5rem',
                                            flexDirection: 'column',
                                            backgroundColor: status === 'half-day' ? 'var(--color-warning-bg)' : 'transparent',
                                            border: status === 'half-day' ? '1px solid var(--color-warning)' : '1px solid var(--color-border)',
                                            color: status === 'half-day' ? 'var(--color-warning)' : 'var(--color-text-muted)',
                                            opacity: status === 'half-day' ? 1 : 0.7
                                        }}
                                        title="Shift: 08:00 - 13:00 (5h)"
                                    >
                                        <Clock size={20} className="mb-1" />
                                        <span className="text-xs font-medium">5 Hr</span>
                                    </button>

                                    <button
                                        onClick={() => setStatus(emp.id, 'absent')}
                                        className="btn"
                                        style={{
                                            padding: '0.5rem',
                                            flexDirection: 'column',
                                            backgroundColor: status === 'absent' ? 'var(--color-danger-bg)' : 'transparent',
                                            border: status === 'absent' ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
                                            color: status === 'absent' ? 'var(--color-danger)' : 'var(--color-text-muted)',
                                            opacity: status === 'absent' ? 1 : 0.7
                                        }}
                                        title="Clear Hours"
                                    >
                                        <X size={20} className="mb-1" />
                                        <span className="text-xs font-medium">Reset</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
