'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { Filter, FileText } from 'lucide-react';
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

        return { totalCost, employeeCosts };
    };

    const reportData = calculateReport();

    return (
        <div className="shell">
            <div className="page-header">
                <div>
                    <div className="page-kicker">Analysis</div>
                    <h1 className="page-title">Reports</h1>
                    <p className="page-subtitle">Analyze labor hours and cost contribution by site and date range.</p>
                </div>
            </div>

            <div className="panel mb-8">
                <div className="flex items-center gap-2 mb-4 text-blue-800">
                    <Filter size={20} />
                    <h2 className="font-bold">Report Settings</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div>
                    <div className="panel mb-8 text-center" style={{ background: 'var(--color-dark)', color: '#fff' }}>
                        <p className="font-medium mb-2 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.66)' }}>Total Labor Cost</p>
                        <p className="text-5xl font-bold mb-2">{reportData.totalCost.toLocaleString()}</p>
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.66)' }}>
                            {reportSite ? `at ${sites.find(s => s.id === reportSite)?.name}` : 'Across All Sites'}
                            {' - '}
                            {reportStart} to {reportEnd}
                        </p>
                    </div>

                    <div className="panel">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText size={20} className="text-gray-500" />
                            <h3 className="font-bold text-gray-700">Cost Breakdown by Employee</h3>
                        </div>

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th className="text-right">Total Hours</th>
                                        <th className="text-right">Cost Contribution</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.values(reportData.employeeCosts)
                                        .sort((a, b) => b.cost - a.cost)
                                        .map(item => (
                                            <tr key={item.name}>
                                                <td className="font-medium text-gray-900">{item.name}</td>
                                                <td className="text-right text-gray-600">{item.hours.toFixed(1)}</td>
                                                <td className="text-right font-mono font-bold text-blue-700">{item.cost.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    {Object.keys(reportData.employeeCosts).length === 0 && (
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
                        <Filter size={44} className="mx-auto" />
                        <h3>Select a date range</h3>
                        <p>Choose start and end dates above to generate the report.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
