'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { AlertTriangle, BadgeDollarSign, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Download, FileText, Loader2, Paperclip, Pencil, Receipt, Search, Timer, Trash2, Wallet, X } from 'lucide-react';
import { getCurrentMonthRange, getSriLankaDate } from '@/lib/dateUtils';
import { Employee } from '@/lib/types';
import { calculateAttendanceRecordsEarnings, calculateAttendanceSegmentCosts, getAttendanceHours } from '@/lib/salary';
import { downloadCSV } from '@/lib/exportUtils';
import { getAttachmentSignedUrl, uploadAttachment, validateAttachmentFile } from '@/lib/storage';
import { AttachmentImage } from '@/components/AttachmentImage';

const formatPaymentType = (type?: string) => {
    if (type === 'advance') return 'Advance';
    if (type === 'bonus') return 'Bonus';
    return 'Salary';
};

export default function SalaryPage() {
    const { employees, attendance, payments, user, addPayment, updatePayment, deletePayment, sites } = useApp();
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
    const [viewDetailsEmployee, setViewDetailsEmployee] = useState<string | null>(null);
    const [payAmount, setPayAmount] = useState('');
    const [payReceiptPath, setPayReceiptPath] = useState<string | undefined>(undefined);
    const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
    const payReceiptInputRef = useRef<HTMLInputElement>(null);
    const [selectedDate, setSelectedDate] = useState(getSriLankaDate());
    const [isPaymentLogOpen, setIsPaymentLogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit Payment State
    const [editingPayment, setEditingPayment] = useState<{ id: string, amount: string, date: string, notes: string, receiptPath?: string } | null>(null);
    const [isUploadingEditReceipt, setIsUploadingEditReceipt] = useState(false);
    const editReceiptInputRef = useRef<HTMLInputElement>(null);

    const handleReceiptFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
        onUploaded: (path: string) => void,
        setUploading: (value: boolean) => void
    ) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !user) return;

        const validationError = validateAttachmentFile('payment-receipts', file);
        if (validationError) {
            alert(validationError);
            return;
        }

        setUploading(true);
        try {
            const path = await uploadAttachment('payment-receipts', user.id, file);
            onUploaded(path);
        } catch (err) {
            console.error('Error uploading receipt:', err);
            alert('Failed to upload receipt. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleOpenReceipt = async (path: string) => {
        // Deliberately no noopener/noreferrer here: those make window.open() return null,
        // and we need the reference below to navigate the tab once the signed URL resolves.
        const newTab = window.open('', '_blank');
        const url = await getAttachmentSignedUrl('payment-receipts', path);
        if (url && newTab) {
            newTab.opener = null;
            newTab.location.href = url;
        } else {
            newTab?.close();
            alert('Could not load receipt. Please try again.');
        }
    };

    const handleDateChange = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    const todaysPayments = payments.filter(p => p.date === selectedDate);
    const totalPaidToday = todaysPayments.reduce((sum, p) => sum + p.amount, 0);

    // Calculation Logic
    const getFinancials = (employee: Employee) => {
        // ... (existing logic)
        // 1. Calculate Earned
        const empAttendance = attendance.filter(a => a.employeeId === employee.id);
        let totalEarned = 0;
        let totalHours = 0;

        totalEarned = calculateAttendanceRecordsEarnings(employee, empAttendance);
        totalHours = empAttendance.reduce((sum, record) => sum + getAttendanceHours(record), 0);

        // 2. Calculate Paid
        const empPayments = payments.filter(p => p.employeeId === employee.id);
        const totalPaid = empPayments.reduce((acc, curr) => acc + curr.amount, 0);

        return {
            totalEarned,
            totalPaid,
            balance: totalEarned - totalPaid,
            totalHours,
            daysPresent: new Set(empAttendance.filter(a => getAttendanceHours(a) > 0).map(a => a.date)).size,
        };
    };

    const handlePay = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee || !payAmount) return;

        addPayment({
            employeeId: selectedEmployee,
            amount: Number(payAmount),
            date: selectedDate, // Use selected date for payment
            type: 'salary',
            notes: 'Manual Payment',
            receiptPath: payReceiptPath
        });

        setSelectedEmployee(null);
        setPayAmount('');
        setPayReceiptPath(undefined);
    };

    const currentMonthRange = getCurrentMonthRange();
    const activeEmployee = selectedEmployee ? employees.find(e => e.id === selectedEmployee) : null;
    const detailsEmployee = viewDetailsEmployee ? employees.find(e => e.id === viewDetailsEmployee) : null;
    const employeeFinancials = employees.map(employee => ({
        employee,
        financials: getFinancials(employee),
    }));
    const filteredFinancials = employeeFinancials
        .filter(({ employee }) =>
            employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (employee.nic && employee.nic.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => b.financials.balance - a.financials.balance);
    const totalEarnedAll = employeeFinancials.reduce((sum, item) => sum + item.financials.totalEarned, 0);
    const totalPaidAll = employeeFinancials.reduce((sum, item) => sum + item.financials.totalPaid, 0);
    const totalBalanceAll = employeeFinancials.reduce((sum, item) => sum + item.financials.balance, 0);

    const handleExportLedgerCSV = () => {
        const rows: (string | number)[][] = filteredFinancials.map(({ employee, financials }) => [
            employee.name,
            employee.role,
            financials.totalHours.toFixed(1),
            financials.totalEarned.toFixed(2),
            financials.totalPaid.toFixed(2),
            financials.balance.toFixed(2),
        ]);

        downloadCSV(
            `payroll-ledger_${getSriLankaDate()}.csv`,
            ['Employee', 'Role', 'Total Hours', 'Earned', 'Paid', 'Balance Due'],
            rows
        );
    };

    const handleExportPaymentLogCSV = () => {
        const rows: (string | number)[][] = todaysPayments.map(p => {
            const emp = employees.find(e => e.id === p.employeeId);
            return [emp?.name || 'Unknown', formatPaymentType(p.type), p.notes || '', p.amount];
        });

        downloadCSV(
            `payment-log_${selectedDate}.csv`,
            ['Employee', 'Type', 'Notes', 'Amount'],
            rows
        );
    };

    return (
        <div className="shell payments-page">
            <div className="page-header payments-header flex-col md:flex-row gap-4 items-start md:items-end">
                <div>
                    <div className="page-kicker">Payroll</div>
                    <h1 className="page-title">Payments</h1>
                    <p className="page-subtitle">Prioritize balances, record payments, and review worker ledgers from one workbench.</p>
                </div>

                <div className="date-control payments-date-control">
                    <button onClick={() => handleDateChange(-1)} className="icon-button" type="button" aria-label="Previous day">
                        <ChevronLeft size={20} />
                    </button>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="input"
                    />
                    <button onClick={() => handleDateChange(1)} className="icon-button" type="button" aria-label="Next day">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="insight-strip">
                <div className="insight-card">
                    <div>
                        <span>Total Earned</span>
                        <strong>{totalEarnedAll.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
                    </div>
                    <div className="soft-icon info">
                        <BadgeDollarSign size={20} />
                    </div>
                </div>
                <div className="insight-card">
                    <div>
                        <span>Paid All Time</span>
                        <strong>{totalPaidAll.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
                    </div>
                    <div className="soft-icon">
                        <Wallet size={20} />
                    </div>
                </div>
                <div className="insight-card">
                    <div>
                        <span>Balance Due</span>
                        <strong>{totalBalanceAll.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
                    </div>
                    <div className="soft-icon danger">
                        <AlertTriangle size={20} />
                    </div>
                </div>
                <div className="insight-card">
                    <div>
                        <span>Paid Today</span>
                        <strong>{totalPaidToday.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
                    </div>
                    <div className="soft-icon primary">
                        <Timer size={20} />
                    </div>
                </div>
            </div>


            {/* Daily Payment Summary */}
            <div className="panel payments-daily-log mb-8">
                <div
                    className="payments-daily-log-header cursor-pointer select-none"
                    onClick={() => setIsPaymentLogOpen(!isPaymentLogOpen)}
                >
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-blue-900">Payment Log for {selectedDate}</h2>
                        {isPaymentLogOpen ? <ChevronUp size={20} className="text-blue-700" /> : <ChevronDown size={20} className="text-blue-700" />}
                    </div>
                    <div className="flex items-center gap-3">
                        {todaysPayments.length > 0 && (
                            <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={(e) => { e.stopPropagation(); handleExportPaymentLogCSV(); }}
                            >
                                <Download size={16} />
                                Export CSV
                            </button>
                        )}
                        <span className="text-2xl font-bold text-blue-700">{totalPaidToday.toLocaleString()}</span>
                    </div>
                </div>

                {isPaymentLogOpen && (
                    <div className="mt-4">
                        {todaysPayments.length > 0 ? (
                            <div className="bg-white rounded-lg border border-blue-100 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-blue-50/50 text-blue-900">
                                        <tr>
                                            <th className="p-3">Employee</th>
                                            <th className="p-3">Type</th>
                                            <th className="p-3">Notes</th>
                                            <th className="p-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {todaysPayments.map(p => {
                                            const emp = employees.find(e => e.id === p.employeeId);
                                            return (
                                                <tr key={p.id} className="border-t border-blue-50">
                                                    <td className="p-3 font-medium">{emp?.name || 'Unknown'}</td>
                                                    <td className="p-3">
                                                        <span className={`payment-type-badge payment-type-${p.type || 'salary'}`}>{formatPaymentType(p.type)}</span>
                                                    </td>
                                                    <td className="p-3 text-gray-500">
                                                        {p.notes}
                                                        {p.receiptPath && (
                                                            <button
                                                                type="button"
                                                                className="receipt-attachment-link ml-2"
                                                                onClick={() => handleOpenReceipt(p.receiptPath!)}
                                                                title="View receipt"
                                                            >
                                                                <Paperclip size={12} />
                                                                Receipt
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-right font-mono font-bold">{p.amount}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-blue-400 italic">No payments recorded for this date.</p>
                        )}
                    </div>
                )}
            </div>

            <div className="workbench-panel">
                <div className="workbench-header">
                    <div>
                        <h2 className="workbench-title">Payment Workbench</h2>
                        <p className="workbench-meta">Highest balances appear first. Showing {filteredFinancials.length} of {employees.length} employees.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="search-box payments-search-box">
                            <Search size={18} className="text-[var(--color-text-muted)]" />
                            <input
                                type="text"
                                placeholder="Search employee, role, or NIC..."
                                className="input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={handleExportLedgerCSV}
                            disabled={filteredFinancials.length === 0}
                        >
                            <Download size={16} />
                            Export CSV
                        </button>
                    </div>
                </div>
                <div className="workbench-body">
            {employees.length === 0 ? (
                <div className="empty-state">
                    <div>
                        <BadgeDollarSign size={44} className="mx-auto" />
                        <h3>No employees yet</h3>
                        <p>Add employees before recording payments.</p>
                    </div>
                </div>
            ) : (
                filteredFinancials.length === 0 ? (
                    <div className="empty-state">
                        <div>
                            <Search size={44} className="mx-auto" />
                            <h3>No payment records found</h3>
                            <p>Try a different employee name, role, or NIC.</p>
                        </div>
                    </div>
                ) : (
                <div className="salary-grid">
                    {filteredFinancials.map(({ employee: emp, financials }) => {
                        const { totalEarned, totalPaid, balance, totalHours } = financials;
                        return (
                            <div key={emp.id} className={`card card-interactive salary-card payment-card ${balance > 0 ? 'payment-card-due' : 'payment-card-settled'}`}>
                                <div className="salary-card-top">
                                    <div className="employee-cell">
                                        <AttachmentImage
                                            bucket="employee-photos"
                                            path={emp.photoPath}
                                            alt={emp.name}
                                            className="avatar-sm avatar-photo"
                                            fallback={<div className="avatar-sm">{emp.name.charAt(0).toUpperCase()}</div>}
                                        />
                                        <div>
                                            <h3 className="font-bold text-lg text-[var(--color-dark)]">{emp.name}</h3>
                                            <p className="text-sm text-[var(--color-text-muted)]">{emp.role}</p>
                                        </div>
                                    </div>
                                    <span className="rate-chip"><span>Rate</span>{emp.dailyRate}</span>
                                </div>

                                <div className="salary-balance">
                                    <span className="metric-label">{balance > 0 ? 'Balance Due' : 'Settled Balance'}</span>
                                    <strong className={balance > 0 ? 'text-danger' : ''}>
                                        {balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </strong>
                                    <p className="payment-card-note">
                                        {balance > 0 ? 'Payment recommended' : 'No outstanding balance'}
                                    </p>
                                </div>

                                <div className="financial-grid">
                                    <div className="financial-tile">
                                        <span>Hours</span>
                                        <strong>{totalHours.toFixed(1)}</strong>
                                    </div>
                                    <div className="financial-tile">
                                        <span>Earned</span>
                                        <strong>{totalEarned.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
                                    </div>
                                    <div className="financial-tile">
                                        <span>Paid</span>
                                        <strong className="text-success">{totalPaid.toLocaleString()}</strong>
                                    </div>
                                </div>

                                <div className="salary-actions salary-actions-triple">
                                    <button
                                        onClick={() => setViewDetailsEmployee(emp.id)}
                                        className="btn btn-outline"
                                    >
                                        <FileText size={18} />
                                        Details
                                    </button>
                                    <Link
                                        href={`/salary/payslip/${emp.id}?start=${currentMonthRange.start}&end=${currentMonthRange.end}`}
                                        className="btn btn-outline"
                                    >
                                        <Receipt size={18} />
                                        Payslip
                                    </Link>
                                    <button
                                        onClick={() => setSelectedEmployee(emp.id)}
                                        className="btn btn-primary"
                                    >
                                        <BadgeDollarSign size={18} />
                                        Pay
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                )
            )}
                </div>
            </div>

            {/* Details Modal */}
            {
                detailsEmployee && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="modal-card max-w-2xl">
                            <div className="modal-header">
                                <div>
                                    <h2 className="modal-title">{detailsEmployee.name}</h2>
                                    <p className="modal-subtitle">Attendance and payment history</p>
                                </div>
                                <button onClick={() => setViewDetailsEmployee(null)} className="icon-button" type="button">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="mb-8">
                                <h3 className="label mb-3">Attendance History</h3>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Role</th>
                                                <th>Site</th>
                                                <th>Time / Status</th>
                                                <th className="text-right">Earned</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {calculateAttendanceSegmentCosts(detailsEmployee, attendance.filter(a => a.employeeId === detailsEmployee.id))
                                                .sort((a, b) => new Date(b.record.date).getTime() - new Date(a.record.date).getTime())
                                                .map(({ record, cost }) => {
                                                    let displayTime = '';

                                                    const recordRole = record.role || detailsEmployee.role;

                                                    if (record.workingHours !== undefined) {
                                                        displayTime = `${record.workingHours} Hrs`;
                                                        if (record.startTime && record.endTime) {
                                                            displayTime += ` (${record.startTime} - ${record.endTime})`;
                                                        }
                                                    } else {
                                                        if (record.status === 'present') displayTime = 'Full Day (10.5h)';
                                                        if (record.status === 'half-day') displayTime = 'Half Day (5h)';
                                                    }

                                                    return (
                                                        <tr key={record.id}>
                                                            <td className="font-mono text-sm">{record.date.split('T')[0]}</td>
                                                            <td className="text-sm text-[var(--color-primary)] font-medium">
                                                                {recordRole}
                                                            </td>
                                                            <td className="text-sm">
                                                                {record.site ? (sites.find(s => s.id === record.site)?.name || 'Unknown Site') : '-'}
                                                            </td>
                                                            <td className="text-sm font-medium">
                                                                {displayTime || record.status}
                                                            </td>
                                                            <td className="text-right font-mono">{cost.toFixed(0)}</td>
                                                        </tr>
                                                    )
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div>
                                <h3 className="label mb-3">Payment History</h3>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Type</th>
                                                <th>Notes</th>
                                                <th className="text-right">Amount</th>
                                                <th className="text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payments
                                                .filter(p => p.employeeId === detailsEmployee.id)
                                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                .map(payment => (
                                                    <tr key={payment.id} className="group hover:bg-gray-50">
                                                        <td className="font-mono text-sm">{payment.date.split('T')[0]}</td>
                                                        <td>
                                                            <span className={`payment-type-badge payment-type-${payment.type || 'salary'}`}>{formatPaymentType(payment.type)}</span>
                                                        </td>
                                                        <td className="text-sm text-[var(--color-text-muted)]">
                                                            {payment.notes || '-'}
                                                            {payment.receiptPath && (
                                                                <button
                                                                    type="button"
                                                                    className="receipt-attachment-link ml-2"
                                                                    onClick={() => handleOpenReceipt(payment.receiptPath!)}
                                                                    title="View receipt"
                                                                >
                                                                    <Paperclip size={12} />
                                                                    Receipt
                                                                </button>
                                                            )}
                                                        </td>
                                                        <td className="text-right font-mono font-bold text-[var(--color-success)]">{payment.amount}</td>
                                                        <td className="text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => setEditingPayment({
                                                                    id: payment.id,
                                                                    amount: payment.amount.toString(),
                                                                    date: payment.date.split('T')[0],
                                                                    notes: payment.notes || '',
                                                                    receiptPath: payment.receiptPath
                                                                })}
                                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                                title="Edit"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm('Are you sure you want to delete this payment?')) {
                                                                        deletePayment(payment.id);
                                                                    }
                                                                }}
                                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Payment Modal */}
            {
                selectedEmployee && activeEmployee && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="modal-card max-w-sm">
                            <div className="modal-header">
                                <div>
                                    <h3 className="modal-title">Pay {activeEmployee.name}</h3>
                                    <p className="modal-subtitle">Record a salary payment for the selected date.</p>
                                </div>
                            </div>
                            {/* Same Payment Modal Content */}
                            <div className="payment-modal-balance">
                                <div className="flex justify-between mb-1">
                                    <span className="text-gray-500">Balance Due:</span>
                                    <span className="font-bold">{getFinancials(activeEmployee).balance.toLocaleString()}</span>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-outline btn-sm btn-block mt-4"
                                    onClick={() => setPayAmount(Math.max(0, getFinancials(activeEmployee).balance).toString())}
                                    disabled={getFinancials(activeEmployee).balance <= 0}
                                >
                                    Fill Full Balance
                                </button>
                            </div>

                            <form onSubmit={handlePay}>
                                <div className="mb-4">
                                    <label className="label">Amount to Pay</label>
                                    <input
                                        type="number"
                                        className="input text-lg"
                                        autoFocus
                                        placeholder="0.00"
                                        value={payAmount}
                                        onChange={e => setPayAmount(e.target.value)}
                                        min="1"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="label">Receipt (Optional)</label>
                                    <div className="receipt-upload-row">
                                        <button
                                            type="button"
                                            className="btn btn-outline btn-sm"
                                            onClick={() => payReceiptInputRef.current?.click()}
                                            disabled={isUploadingReceipt}
                                        >
                                            {isUploadingReceipt ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                                            {payReceiptPath ? 'Replace Receipt' : 'Attach Receipt'}
                                        </button>
                                        {payReceiptPath && !isUploadingReceipt && (
                                            <button
                                                type="button"
                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                onClick={() => setPayReceiptPath(undefined)}
                                                title="Remove receipt"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        ref={payReceiptInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,application/pdf"
                                        className="hidden"
                                        onChange={e => handleReceiptFileChange(e, setPayReceiptPath, setIsUploadingReceipt)}
                                    />
                                </div>

                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedEmployee(null); setPayReceiptPath(undefined); }}
                                        className="btn btn-outline"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                    >
                                        Confirm Payment
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Edit Payment Modal */}
            {editingPayment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
                    <div className="modal-card max-w-sm">
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">Edit Payment</h3>
                                <p className="modal-subtitle">Update amount, date, or notes.</p>
                            </div>
                            <button onClick={() => setEditingPayment(null)} className="icon-button" type="button">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if (editingPayment) {
                                updatePayment(editingPayment.id, {
                                    amount: Number(editingPayment.amount),
                                    date: editingPayment.date,
                                    notes: editingPayment.notes,
                                    receiptPath: editingPayment.receiptPath
                                });
                                setEditingPayment(null);
                            }
                        }}>
                            <div className="mb-3">
                                <label className="label">Date</label>
                                <input
                                    type="date"
                                    className="input w-full"
                                    value={editingPayment.date}
                                    onChange={e => setEditingPayment({ ...editingPayment, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="label">Amount</label>
                                <input
                                    type="number"
                                    className="input w-full"
                                    value={editingPayment.amount}
                                    onChange={e => setEditingPayment({ ...editingPayment, amount: e.target.value })}
                                    required
                                    min="0"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="label">Notes</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={editingPayment.notes}
                                    onChange={e => setEditingPayment({ ...editingPayment, notes: e.target.value })}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="label">Receipt</label>
                                <div className="receipt-upload-row">
                                    {editingPayment.receiptPath && (
                                        <button
                                            type="button"
                                            className="receipt-attachment-link"
                                            onClick={() => handleOpenReceipt(editingPayment.receiptPath!)}
                                        >
                                            <Paperclip size={14} />
                                            View current
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="btn btn-outline btn-sm"
                                        onClick={() => editReceiptInputRef.current?.click()}
                                        disabled={isUploadingEditReceipt}
                                    >
                                        {isUploadingEditReceipt ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                                        {editingPayment.receiptPath ? 'Replace' : 'Attach'}
                                    </button>
                                    {editingPayment.receiptPath && !isUploadingEditReceipt && (
                                        <button
                                            type="button"
                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                            onClick={() => setEditingPayment({ ...editingPayment, receiptPath: undefined })}
                                            title="Remove receipt"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                                <input
                                    ref={editReceiptInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                    className="hidden"
                                    onChange={e => handleReceiptFileChange(
                                        e,
                                        (path) => setEditingPayment(prev => prev ? { ...prev, receiptPath: path } : prev),
                                        setIsUploadingEditReceipt
                                    )}
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingPayment(null)}
                                    className="btn btn-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div >
    );
}
