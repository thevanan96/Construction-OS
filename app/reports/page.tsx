'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { BadgeDollarSign, CalendarDays, Clock, Filter, FileText, Users } from 'lucide-react';
import { calculateAttendanceSegmentCosts } from '@/lib/salary';

export default function ReportsPage() {
    const { employees, attendance, sites } = useApp();
    const [reportSite, setReportSite] = useState('');
    const [reportStart, setReportStart] = useState('');
    const [reportEnd, setReportEnd] = useState('');

    const calculateReport = () => {
        if (!reportStart || !reportEnd) return null;

        let totalCost = 0;
        const employeeCosts: Record<string, { name: string, hours: number, cost: number }> = {};

        employees.forEach(emp => {
            const records = attendance.filter(record =>
                record.employeeId === emp.id &&
                record.date >= reportStart &&
                record.date <= reportEnd
            );
            const segmentCosts = calculateAttendanceSegmentCosts(emp, records).filter(({ record }) =>
                !reportSite || record.site === reportSite
            );

            segmentCosts.forEach(({ hours, cost }) => {
                if (!employeeCosts[emp.id]) {
                    employeeCosts[emp.id] = { name: emp.name, hours: 0, cost: 0 };
                }
                employeeCosts[emp.id].hours += hours;
                employeeCosts[emp.id].cost += cost;
                totalCost += cost;
            });
        });

        const rows = Object.values(employeeCosts).sort((a, b) => b.cost - a.cost);
        const totalHours = rows.reduce((sum, item) => sum + item.hours, 0);

        return { totalCost, employeeCosts, rows, totalHours };
    };

    const reportData = calculateReport();
    const selectedSiteName = reportSite ? sites.find(s => s.id === reportSite)?.name || 'Selected site' : 'All sites';

    return (
        <div className="shell reports-page">
            <div className="page-header reports-header">
                <div>
                    <div className="page-kicker">Analysis</div>
                    <h1 className="page-title">Reports</h1>
                    <p className="page-subtitle">Analyze labor hours and cost contribution by site and date range.</p>
                </div>
            </div>

            <div className="panel reports-filter-panel mb-8">
                <div className="section-header mb-4">
                    <div>
                        <h2 className="text-xl font-bold">Report Settings</h2>
                        <p className="page-subtitle">Select the site and date range to generate labor cost totals.</p>
                    </div>
                    <div className="soft-icon info">
                        <Filter size={20} />
                    </div>
                </div>

                <div className="reports-filter-grid">
                    <div>
                        <label className="label">Site</label>
                        <select
                            className="input w-full"
                            value={reportSite}
                            onChange={(e) => setReportSite(e.target.value)}
                        >
                            <option value="">All Sites</option>
                            {sites.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">Start Date</label>
                        <input
                            type="date"
                            className="input w-full"
                            value={reportStart}
                            onChange={(e) => setReportStart(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="label">End Date</label>
                        <input
                            type="date"
                            className="input w-full"
                            value={reportEnd}
                            onChange={(e) => setReportEnd(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {reportData ? (
                <div className="reports-results">
                    <div className="reports-summary-panel mb-8">
                        <div>
                            <p>Total Labor Cost</p>
                            <strong>{reportData.totalCost.toLocaleString()}</strong>
                            <span>{selectedSiteName} · {reportStart} to {reportEnd}</span>
                        </div>
                        <div className="reports-summary-grid">
                            <div>
                                <BadgeDollarSign size={18} />
                                <span>Cost</span>
                                <strong>{reportData.totalCost.toLocaleString()}</strong>
                            </div>
                            <div>
                                <Clock size={18} />
                                <span>Hours</span>
                                <strong>{reportData.totalHours.toFixed(1)}</strong>
                            </div>
                            <div>
                                <Users size={18} />
                                <span>Workers</span>
                                <strong>{reportData.rows.length}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="panel reports-breakdown-panel">
                        <div className="section-header mb-4">
                            <div>
                                <h3 className="text-xl font-bold">Cost Breakdown by Employee</h3>
                                <p className="page-subtitle">Sorted by highest labor cost contribution.</p>
                            </div>
                            <div className="soft-icon primary">
                                <FileText size={20} />
                            </div>
                        </div>

                        <div className="table-container reports-table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th className="text-right">Total Hours</th>
                                        <th className="text-right">Cost Contribution</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.rows
                                        .map(item => (
                                            <tr key={item.name} className="reports-table-row">
                                                <td data-label="Employee" className="font-medium text-gray-900">{item.name}</td>
                                                <td data-label="Total Hours" className="text-right text-gray-600">{item.hours.toFixed(1)}</td>
                                                <td data-label="Cost Contribution" className="text-right font-mono font-bold text-blue-700">{item.cost.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    {reportData.rows.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="text-center py-8 text-gray-400">No work records found for this period.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    <div>
                        <CalendarDays size={44} className="mx-auto" />
                        <h3>Select a date range</h3>
                        <p>Choose start and end dates above to generate the report.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
