'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { ChevronLeft, ChevronRight, Check, X, Clock } from 'lucide-react';
import { AttendanceStatus } from '@/lib/types';

export default function AttendancePage() {
    const { employees, attendance, markAttendance, sites } = useApp();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Local state to track selected site for each employee temporarily before marking
    // This is optional if we want to default to a site or remember last selection
    const [employeeSites, setEmployeeSites] = useState<Record<string, string>>({});

    const handleDateChange = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    const getStatus = (employeeId: string): AttendanceStatus | null => {
        const record = attendance.find(a => a.employeeId === employeeId && a.date === selectedDate);
        return record ? record.status : null;
    };

    const getSite = (employeeId: string): string => {
        const record = attendance.find(a => a.employeeId === employeeId && a.date === selectedDate);
        if (record && record.site) return record.site;
        // Default to first site ID if available, else empty string
        return employeeSites[employeeId] || (sites.length > 0 ? sites[0].id : '');
    };

    const setStatus = (employeeId: string, status: AttendanceStatus) => {
        const currentSite = employeeSites[employeeId] || (sites.length > 0 ? sites[0].id : '');

        markAttendance({
            employeeId,
            date: selectedDate,
            status,
            site: currentSite || undefined // Pass undefined if empty string
        });
    };

    const handleSiteChange = (employeeId: string, siteId: string) => {
        setEmployeeSites(prev => ({ ...prev, [employeeId]: siteId }));

        const currentStatus = getStatus(employeeId);
        if (currentStatus) {
            markAttendance({
                employeeId,
                date: selectedDate,
                status: currentStatus,
                site: siteId || undefined
            });
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Attendance</h1>
                    <p className="page-subtitle">Mark daily attendance for your team</p>
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

            <div className="dashboard-grid">
                {employees.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 col-span-full">
                        No employees found. Add employees first.
                    </div>
                ) : (
                    employees.map(emp => {
                        const status = getStatus(emp.id);
                        const currentSiteId = getSite(emp.id);

                        return (
                            <div key={emp.id} className="card">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-[var(--color-dark)]">{emp.name}</h3>
                                        <p className="text-sm text-[var(--color-text-muted)]">{emp.role}</p>
                                    </div>
                                    <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                                        ${emp.dailyRate}/day
                                    </div>
                                </div>

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

                                <div className="grid grid-cols-3 gap-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => setStatus(emp.id, 'present')}
                                        className="btn"
                                        style={{
                                            padding: '0.5rem',
                                            flexDirection: 'column',
                                            backgroundColor: status === 'present' ? 'var(--color-success-bg)' : 'transparent',
                                            border: status === 'present' ? '1px solid var(--color-success)' : '1px solid var(--color-border)',
                                            color: status === 'present' ? 'var(--color-success)' : 'var(--color-text-muted)'
                                        }}
                                    >
                                        <Check size={20} className="mb-1" />
                                        <span className="text-xs font-medium">Present</span>
                                    </button>

                                    <button
                                        onClick={() => setStatus(emp.id, 'half-day')}
                                        className="btn"
                                        style={{
                                            padding: '0.5rem',
                                            flexDirection: 'column',
                                            backgroundColor: status === 'half-day' ? 'var(--color-warning-bg)' : 'transparent',
                                            border: status === 'half-day' ? '1px solid var(--color-warning)' : '1px solid var(--color-border)',
                                            color: status === 'half-day' ? 'var(--color-warning)' : 'var(--color-text-muted)'
                                        }}
                                    >
                                        <Clock size={20} className="mb-1" />
                                        <span className="text-xs font-medium">Half</span>
                                    </button>

                                    <button
                                        onClick={() => setStatus(emp.id, 'absent')}
                                        className="btn"
                                        style={{
                                            padding: '0.5rem',
                                            flexDirection: 'column',
                                            backgroundColor: status === 'absent' ? 'var(--color-danger-bg)' : 'transparent',
                                            border: status === 'absent' ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
                                            color: status === 'absent' ? 'var(--color-danger)' : 'var(--color-text-muted)'
                                        }}
                                    >
                                        <X size={20} className="mb-1" />
                                        <span className="text-xs font-medium">Absent</span>
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
