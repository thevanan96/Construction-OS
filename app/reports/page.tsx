'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { Filter, FileText } from 'lucide-react';

export default function ReportsPage() {
    const { employees, attendance, sites } = useApp();
    const [reportSite, setReportSite] = useState('');
    const [reportStart, setReportStart] = useState('');
    const [reportEnd, setReportEnd] = useState('');

    // Calculation Logic
    const calculateReport = () => {
        if (!reportStart || !reportEnd) return null;

        let totalCost = 0;
        const employeeCosts: Record<string, { name: string, hours: number, cost: number }> = {};

        attendance.forEach(record => {
            if (record.date < reportStart || record.date > reportEnd) return;
            if (reportSite && record.site !== reportSite) return;

            const emp = employees.find(e => e.id === record.employeeId);
            if (!emp) return;

            let hours = 0;
            let cost = 0;

            if (record.workingHours !== undefined) {
                hours = record.workingHours;
                cost = (emp.dailyRate / 10) * hours;
            } else {
                if (record.status === 'present') {
                    hours = 10;
                    cost = emp.dailyRate;
                } else if (record.status === 'half-day') {
                    hours = 5;
                    cost = emp.dailyRate / 2;
                }
            }

            if (!employeeCosts[emp.id]) {
                employeeCosts[emp.id] = { name: emp.name, hours: 0, cost: 0 };
            }
            employeeCosts[emp.id].hours += hours;
            employeeCosts[emp.id].cost += cost;
            totalCost += cost;
        });

        return { totalCost, employeeCosts };
    };

    const reportData = calculateReport();

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Reports</h1>
                    <p className="page-subtitle">Custom Labor Cost Analysis</p>
                </div>
            </div>

            <div className="card mb-8">
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
                    {/* Summary Card */}
                    <div className="bg-blue-600 text-white p-8 rounded-2xl mb-8 shadow-lg text-center">
                        <p className="text-blue-100 font-medium mb-2 uppercase tracking-wide">Total Labor Cost</p>
                        <p className="text-5xl font-bold mb-2">${reportData.totalCost.toLocaleString()}</p>
                        <p className="text-sm text-blue-200">
                            {reportSite ? `at ${sites.find(s => s.id === reportSite)?.name}` : 'Across All Sites'}
                            {' • '}
                            {reportStart} to {reportEnd}
                        </p>
                    </div>

                    {/* Detailed Table */}
                    <div className="card">
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
                                                <td className="text-right font-mono font-bold text-blue-700">${item.cost.toLocaleString()}</td>
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
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <Filter size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-500">Select a Date Range</h3>
                    <p className="text-gray-400 text-sm">Choose a start and end date above to generate the report.</p>
                </div>
            )}
        </div>
    );
}
