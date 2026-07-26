'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { BadgeDollarSign, CalendarDays, Clock, Download, Filter, FileText, Package, Target, Users } from 'lucide-react';
import { calculateAttendanceSegmentCosts } from '@/lib/salary';
import { downloadCSV } from '@/lib/exportUtils';
import { formatExpenseCategoryLabel, Site } from '@/lib/types';
import { formatCurrency } from '@/lib/currency';

export default function ReportsPage() {
    const { employees, attendance, expenses, sites } = useApp();
    const [reportSite, setReportSite] = useState('');
    const [reportStart, setReportStart] = useState('');
    const [reportEnd, setReportEnd] = useState('');

    const calculateSiteActual = (siteId: string) => {
        let labor = 0;
        employees.forEach(emp => {
            const records = attendance.filter(record => record.employeeId === emp.id && record.site === siteId);
            labor += calculateAttendanceSegmentCosts(emp, records).reduce((sum, { cost }) => sum + cost, 0);
        });
        const expenseTotal = expenses
            .filter(e => e.siteId === siteId)
            .reduce((sum, e) => sum + e.amount, 0);

        return { labor, expenses: expenseTotal, total: labor + expenseTotal };
    };

    const budgetedSites = sites.filter((s): s is Site & { budget: number } => s.budget !== undefined && s.budget > 0);
    const budgetRows = budgetedSites
        .map(site => {
            const actual = calculateSiteActual(site.id).total;
            return {
                site,
                budget: site.budget,
                actual,
                variance: site.budget - actual,
                percentUsed: site.budget > 0 ? (actual / site.budget) * 100 : 0
            };
        })
        .filter(row => !reportSite || row.site.id === reportSite);

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

        const expenseRows = expenses.filter(e =>
            e.date >= reportStart &&
            e.date <= reportEnd &&
            (!reportSite || e.siteId === reportSite)
        ).sort((a, b) => b.amount - a.amount);
        const totalExpenses = expenseRows.reduce((sum, e) => sum + e.amount, 0);

        return { totalCost, employeeCosts, rows, totalHours, expenseRows, totalExpenses };
    };

    const reportData = calculateReport();
    const selectedSiteName = reportSite ? sites.find(s => s.id === reportSite)?.name || 'Selected site' : 'All sites';

    const handleExportCSV = () => {
        if (!reportData) return;

        const rows: (string | number)[][] = reportData.rows.map(item => [
            item.name,
            item.hours.toFixed(1),
            item.cost.toFixed(2),
        ]);
        rows.push(['Total', reportData.totalHours.toFixed(1), reportData.totalCost.toFixed(2)]);

        const siteSlug = selectedSiteName.replace(/\s+/g, '-').toLowerCase();
        downloadCSV(
            `labor-report_${siteSlug}_${reportStart}_to_${reportEnd}.csv`,
            ['Employee', 'Total Hours', 'Cost Contribution'],
            rows
        );
    };

    const handleExportExpensesCSV = () => {
        if (!reportData) return;

        const rows: (string | number)[][] = reportData.expenseRows.map(expense => [
            expense.date.split('T')[0],
            formatExpenseCategoryLabel(expense.category),
            expense.description,
            expense.vendor || '',
            expense.amount.toFixed(2),
        ]);
        rows.push(['', '', '', 'Total', reportData.totalExpenses.toFixed(2)]);

        const siteSlug = selectedSiteName.replace(/\s+/g, '-').toLowerCase();
        downloadCSV(
            `expense-report_${siteSlug}_${reportStart}_to_${reportEnd}.csv`,
            ['Date', 'Category', 'Description', 'Vendor', 'Amount'],
            rows
        );
    };

    return (
        <div className="shell reports-page">
            <div className="page-header reports-header">
                <div>
                    <div className="page-kicker">Analysis</div>
                    <h1 className="page-title">Reports</h1>
                    <p className="page-subtitle">Analyze labor and expense costs by site and date range.</p>
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

            <div className="panel reports-breakdown-panel mb-8">
                <div className="section-header mb-4">
                    <div>
                        <h3 className="text-xl font-bold">Budget vs Actual</h3>
                        <p className="page-subtitle">All-time spend per site against its budget, independent of the date range above.</p>
                    </div>
                    <div className="soft-icon warning">
                        <Target size={20} />
                    </div>
                </div>

                {budgetRows.length === 0 ? (
                    <div className="empty-state">
                        <div>
                            <Target size={44} className="mx-auto" />
                            <h3>No site budgets set</h3>
                            <p>Add a budget to a site from the Sites page to track spend against it here.</p>
                        </div>
                    </div>
                ) : (
                    <div className="budget-vs-actual-grid">
                        {budgetRows.map(row => {
                            const isOverBudget = row.variance < 0;
                            return (
                                <div key={row.site.id} className="budget-vs-actual-card">
                                    <div className="budget-vs-actual-header">
                                        <span className="budget-vs-actual-site-name">{row.site.name}</span>
                                        <span className={`status-badge ${isOverBudget ? 'status-badge-danger' : 'status-badge-success'}`}>
                                            {isOverBudget ? 'Over Budget' : 'On Track'}
                                        </span>
                                    </div>
                                    <div className="budget-vs-actual-figures">
                                        <div>
                                            <span>Budget</span>
                                            <strong>{formatCurrency(row.budget)}</strong>
                                        </div>
                                        <div>
                                            <span>Actual</span>
                                            <strong>{formatCurrency(row.actual)}</strong>
                                        </div>
                                        <div>
                                            <span>{isOverBudget ? 'Over by' : 'Remaining'}</span>
                                            <strong className={isOverBudget ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}>
                                                {formatCurrency(Math.abs(row.variance))}
                                            </strong>
                                        </div>
                                    </div>
                                    <div className="progress-track">
                                        <div
                                            className={`progress-fill ${isOverBudget ? 'progress-fill-danger' : ''}`}
                                            style={{ width: `${Math.min(row.percentUsed, 100)}%` }}
                                        />
                                    </div>
                                    <span className="budget-vs-actual-percent">{row.percentUsed.toFixed(0)}% of budget used</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {reportData ? (
                <div className="reports-results">
                    <div className="reports-summary-panel mb-8">
                        <div>
                            <p>Total Site Cost</p>
                            <strong>{formatCurrency(reportData.totalCost + reportData.totalExpenses)}</strong>
                            <span>{selectedSiteName} · {reportStart} to {reportEnd}</span>
                        </div>
                        <div className="reports-summary-grid">
                            <div>
                                <BadgeDollarSign size={18} />
                                <span>Labor Cost</span>
                                <strong>{formatCurrency(reportData.totalCost)}</strong>
                            </div>
                            <div>
                                <Package size={18} />
                                <span>Expenses</span>
                                <strong>{formatCurrency(reportData.totalExpenses)}</strong>
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
                            <div className="flex items-center gap-3">
                                <button type="button" className="btn btn-outline btn-sm" onClick={handleExportCSV}>
                                    <Download size={16} />
                                    Export CSV
                                </button>
                                <div className="soft-icon primary">
                                    <FileText size={20} />
                                </div>
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
                                                <td data-label="Cost Contribution" className="text-right font-mono font-bold text-blue-700">{formatCurrency(item.cost)}</td>
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

                    <div className="panel reports-breakdown-panel mt-8">
                        <div className="section-header mb-4">
                            <div>
                                <h3 className="text-xl font-bold">Expense Breakdown</h3>
                                <p className="page-subtitle">Materials, equipment, and subcontractor costs for this period.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button type="button" className="btn btn-outline btn-sm" onClick={handleExportExpensesCSV} disabled={reportData.expenseRows.length === 0}>
                                    <Download size={16} />
                                    Export CSV
                                </button>
                                <div className="soft-icon primary">
                                    <Package size={20} />
                                </div>
                            </div>
                        </div>

                        <div className="table-container reports-table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Category</th>
                                        <th>Description</th>
                                        <th className="text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.expenseRows.map(expense => (
                                        <tr key={expense.id} className="reports-table-row">
                                            <td className="font-mono text-sm">{expense.date.split('T')[0]}</td>
                                            <td className="text-sm">{formatExpenseCategoryLabel(expense.category)}</td>
                                            <td className="text-sm text-gray-600">{expense.description}</td>
                                            <td className="text-right font-mono font-bold text-blue-700">{formatCurrency(expense.amount)}</td>
                                        </tr>
                                    ))}
                                    {reportData.expenseRows.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-center py-8 text-gray-400">No expenses recorded for this period.</td>
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
