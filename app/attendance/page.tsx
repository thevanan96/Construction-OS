'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { ChevronLeft, ChevronRight, Check, X, Clock, Search } from 'lucide-react';
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

    // Reset local overrides when date changes
    useEffect(() => {
        setEmployeeSites({});
        setEmployeeRoles({});
    }, [selectedDate]);

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
                            <div key={emp.id} className="card p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-[var(--color-dark)]">{emp.name}</h3>
                                        <div className="text-sm text-gray-500 flex flex-wrap items-center gap-2 mt-1">
                                            {/* Role Selector or Display */}
                                            {emp.additionalRoles && emp.additionalRoles.length > 0 ? (
                                                <select
                                                    value={currentRole}
                                                    onChange={(e) => handleRoleChange(emp.id, e.target.value)}
                                                    className="text-xs border-none bg-gray-100 rounded px-2 py-1 cursor-pointer focus:ring-0 font-medium text-gray-700"
                                                >
                                                    <option value={emp.role}>{emp.role} (Pri)</option>
                                                    {emp.additionalRoles.map(r => (
                                                        <option key={r.role} value={r.role}>{r.role}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">{emp.role}</span>
                                            )}
                                            <span className="text-gray-300">|</span>
                                            <span className="font-mono text-blue-600 font-bold text-xs">${effectiveRate}/day</span>
                                        </div>
                                    </div>
                                    {workingHours > 0 && (
                                        <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                                            {workingHours} Hrs
                                        </span>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1 block">Work Site</label>
                                    <select
                                        className="input text-xs p-2 w-full"
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
                                            className="input text-xs p-1 w-full"
                                            value={startTime}
                                            onChange={(e) => handleTimeChange(emp.id, 'startTime', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1 block">End Time</label>
                                        <input
                                            type="time"
                                            className="input text-xs p-1 w-full"
                                            value={endTime}
                                            onChange={(e) => handleTimeChange(emp.id, 'endTime', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setStatus(emp.id, 'present')}
                                        className="btn flex-1 flex flex-col items-center justify-center p-2 h-auto"
                                        style={{
                                            backgroundColor: status === 'present' ? 'var(--color-success-bg)' : 'transparent',
                                            border: status === 'present' ? '1px solid var(--color-success)' : '1px solid var(--color-border)',
                                            color: status === 'present' ? 'var(--color-success)' : 'var(--color-text-muted)',
                                            opacity: status === 'present' ? 1 : 0.7
                                        }}
                                        title="Shift: 08:00 - 18:00 (10h)"
                                    >
                                        <Check size={18} className="mb-1" />
                                        <span className="text-[10px] font-bold">10 Hr</span>
                                    </button>

                                    <button
                                        onClick={() => setStatus(emp.id, 'half-day')}
                                        className="btn flex-1 flex flex-col items-center justify-center p-2 h-auto"
                                        style={{
                                            backgroundColor: status === 'half-day' ? 'var(--color-warning-bg)' : 'transparent',
                                            border: status === 'half-day' ? '1px solid var(--color-warning)' : '1px solid var(--color-border)',
                                            color: status === 'half-day' ? 'var(--color-warning)' : 'var(--color-text-muted)',
                                            opacity: status === 'half-day' ? 1 : 0.7
                                        }}
                                        title="Shift: 08:00 - 13:00 (5h)"
                                    >
                                        <Clock size={18} className="mb-1" />
                                        <span className="text-[10px] font-bold">5 Hr</span>
                                    </button>

                                    <button
                                        onClick={() => setStatus(emp.id, 'absent')}
                                        className="btn flex-1 flex flex-col items-center justify-center p-2 h-auto"
                                        style={{
                                            backgroundColor: status === 'absent' ? 'var(--color-danger-bg)' : 'transparent',
                                            border: status === 'absent' ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
                                            color: status === 'absent' ? 'var(--color-danger)' : 'var(--color-text-muted)',
                                            opacity: status === 'absent' ? 1 : 0.7
                                        }}
                                        title="Clear Hours"
                                    >
                                        <X size={18} className="mb-1" />
                                        <span className="text-[10px] font-bold">Reset</span>
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
