'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/store';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { getCurrentMonthRange } from '@/lib/dateUtils';
import { calculateAttendanceSegmentCosts } from '@/lib/salary';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PDF_MARGIN_X = 14;
const PDF_PAGE_RIGHT = 196;

function withFinalY(doc: jsPDF): number {
    return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

const formatPaymentType = (type?: string) => {
    if (type === 'advance') return 'Advance';
    if (type === 'bonus') return 'Bonus';
    return 'Salary';
};

export default function PayslipPage() {
    const { employeeId } = useParams<{ employeeId: string }>();
    const searchParams = useSearchParams();
    const { employees, attendance, payments, sites, user, isLoading } = useApp();

    const defaultRange = getCurrentMonthRange();
    const [start, setStart] = useState(searchParams.get('start') || defaultRange.start);
    const [end, setEnd] = useState(searchParams.get('end') || defaultRange.end);

    const employee = employees.find(e => e.id === employeeId);

    if (isLoading) return null;

    if (!employee) {
        return (
            <div className="shell">
                <div className="empty-state">
                    <div>
                        <h3>Employee not found</h3>
                        <p>This employee may have been removed.</p>
                        <Link href="/salary" className="btn btn-outline mt-4">
                            <ArrowLeft size={18} />
                            Back to Payments
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const periodAttendance = attendance.filter(a =>
        a.employeeId === employee.id && a.date >= start && a.date <= end
    );
    const segmentCosts = calculateAttendanceSegmentCosts(employee, periodAttendance)
        .sort((a, b) => a.record.date.localeCompare(b.record.date));
    const totalEarned = segmentCosts.reduce((sum, s) => sum + s.cost, 0);
    const totalHours = segmentCosts.reduce((sum, s) => sum + s.hours, 0);

    const periodPayments = payments
        .filter(p => p.employeeId === employee.id && p.date >= start && p.date <= end)
        .sort((a, b) => a.date.localeCompare(b.date));
    const totalPaid = periodPayments.reduce((sum, p) => sum + p.amount, 0);
    const balance = totalEarned - totalPaid;

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        let y = 18;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(user?.companyName || 'Company', PDF_MARGIN_X, y);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('PAYSLIP', PDF_MARGIN_X, y + 6);
        doc.setFontSize(9);
        doc.text(`Pay Period: ${start} to ${end}`, PDF_PAGE_RIGHT, y, { align: 'right' });

        y += 16;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(employee.name, PDF_MARGIN_X, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`Role: ${employee.role}`, PDF_MARGIN_X, y + 6);
        if (employee.nic) doc.text(`NIC: ${employee.nic}`, PDF_MARGIN_X, y + 12);

        y += employee.nic ? 22 : 16;
        doc.setFont('helvetica', 'bold');
        doc.text('Attendance & Earnings', PDF_MARGIN_X, y);

        autoTable(doc, {
            startY: y + 4,
            head: [['Date', 'Role', 'Site', 'Hours', 'Earned']],
            body: segmentCosts.length > 0
                ? segmentCosts.map(({ record, hours, cost }) => [
                    record.date.split('T')[0],
                    record.role || employee.role,
                    record.site ? (sites.find(s => s.id === record.site)?.name || 'Unknown Site') : '-',
                    hours.toFixed(1),
                    cost.toFixed(0),
                ])
                : [['No attendance records in this period.', '', '', '', '']],
            styles: { fontSize: 9 },
            headStyles: { fillColor: [15, 23, 42] },
            margin: { left: PDF_MARGIN_X, right: PDF_MARGIN_X },
        });

        y = withFinalY(doc) + 12;
        doc.setFont('helvetica', 'bold');
        doc.text('Payments Made', PDF_MARGIN_X, y);

        autoTable(doc, {
            startY: y + 4,
            head: [['Date', 'Type', 'Notes', 'Amount']],
            body: periodPayments.length > 0
                ? periodPayments.map(p => [p.date.split('T')[0], formatPaymentType(p.type), p.notes || '-', p.amount.toFixed(0)])
                : [['No payments recorded in this period.', '', '', '']],
            styles: { fontSize: 9 },
            headStyles: { fillColor: [15, 23, 42] },
            margin: { left: PDF_MARGIN_X, right: PDF_MARGIN_X },
        });

        y = withFinalY(doc) + 14;
        doc.setDrawColor(15, 23, 42);
        doc.line(PDF_MARGIN_X, y, PDF_PAGE_RIGHT, y);
        y += 8;

        const summaryItems: [string, string][] = [
            ['Total Hours', totalHours.toFixed(1)],
            ['Total Earned', totalEarned.toFixed(0)],
            ['Total Paid', totalPaid.toFixed(0)],
            [balance > 0 ? 'Balance Due' : 'Settled Balance', balance.toFixed(0)],
        ];
        const colWidth = (PDF_PAGE_RIGHT - PDF_MARGIN_X) / summaryItems.length;
        doc.setFontSize(10);
        summaryItems.forEach(([label, value], i) => {
            const x = PDF_MARGIN_X + i * colWidth;
            doc.setFont('helvetica', 'normal');
            doc.text(label, x, y);
            doc.setFont('helvetica', 'bold');
            doc.text(value, x, y + 6);
        });

        doc.save(`payslip_${employee.name.replace(/\s+/g, '-')}_${start}_to_${end}.pdf`);
    };

    return (
        <div className="shell payslip-page">
            <div className="payslip-toolbar no-print">
                <Link href="/salary" className="btn btn-outline">
                    <ArrowLeft size={18} />
                    Back
                </Link>
                <div className="payslip-range-picker">
                    <label className="label">From</label>
                    <input type="date" className="input" value={start} onChange={e => setStart(e.target.value)} />
                    <label className="label">To</label>
                    <input type="date" className="input" value={end} onChange={e => setEnd(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" className="btn btn-outline" onClick={() => window.print()}>
                        <Printer size={18} />
                        Print
                    </button>
                    <button type="button" className="btn btn-primary" onClick={handleDownloadPDF}>
                        <Download size={18} />
                        Download PDF
                    </button>
                </div>
            </div>

            <div className="payslip-document">
                <div className="payslip-header">
                    <div>
                        <h1 className="payslip-company">{user?.companyName || 'Company'}</h1>
                        <p className="payslip-subtitle">Payslip</p>
                    </div>
                    <div className="payslip-period">
                        <span>Pay Period</span>
                        <strong>{start} to {end}</strong>
                    </div>
                </div>

                <div className="payslip-employee-info">
                    <div>
                        <span className="metric-label">Employee</span>
                        <strong>{employee.name}</strong>
                    </div>
                    <div>
                        <span className="metric-label">Role</span>
                        <strong>{employee.role}</strong>
                    </div>
                    {employee.nic && (
                        <div>
                            <span className="metric-label">NIC</span>
                            <strong>{employee.nic}</strong>
                        </div>
                    )}
                </div>

                <div className="mb-8">
                    <h3 className="label mb-3">Attendance & Earnings</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Role</th>
                                    <th>Site</th>
                                    <th className="text-right">Hours</th>
                                    <th className="text-right">Earned</th>
                                </tr>
                            </thead>
                            <tbody>
                                {segmentCosts.map(({ record, hours, cost }) => (
                                    <tr key={record.id}>
                                        <td className="font-mono text-sm">{record.date.split('T')[0]}</td>
                                        <td className="text-sm">{record.role || employee.role}</td>
                                        <td className="text-sm">
                                            {record.site ? (sites.find(s => s.id === record.site)?.name || 'Unknown Site') : '-'}
                                        </td>
                                        <td className="text-right text-sm">{hours.toFixed(1)}</td>
                                        <td className="text-right font-mono">{cost.toFixed(0)}</td>
                                    </tr>
                                ))}
                                {segmentCosts.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-6 text-gray-400">No attendance records in this period.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="label mb-3">Payments Made</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Notes</th>
                                    <th className="text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {periodPayments.map(payment => (
                                    <tr key={payment.id}>
                                        <td className="font-mono text-sm">{payment.date.split('T')[0]}</td>
                                        <td className="text-sm">{formatPaymentType(payment.type)}</td>
                                        <td className="text-sm text-[var(--color-text-muted)]">{payment.notes || '-'}</td>
                                        <td className="text-right font-mono">{payment.amount.toFixed(0)}</td>
                                    </tr>
                                ))}
                                {periodPayments.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center py-6 text-gray-400">No payments recorded in this period.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="payslip-summary">
                    <div>
                        <span>Total Hours</span>
                        <strong>{totalHours.toFixed(1)}</strong>
                    </div>
                    <div>
                        <span>Total Earned</span>
                        <strong>{totalEarned.toFixed(0)}</strong>
                    </div>
                    <div>
                        <span>Total Paid</span>
                        <strong>{totalPaid.toFixed(0)}</strong>
                    </div>
                    <div className="payslip-summary-balance">
                        <span>{balance > 0 ? 'Balance Due' : 'Settled Balance'}</span>
                        <strong>{balance.toFixed(0)}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}
