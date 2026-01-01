'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { BadgeDollarSign, FileText, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { getSriLankaDate } from '@/lib/dateUtils';

export default function SalaryPage() {
    const { employees, attendance, payments, addPayment, updatePayment, deletePayment, sites } = useApp();
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
    const [viewDetailsEmployee, setViewDetailsEmployee] = useState<string | null>(null);
    const [payAmount, setPayAmount] = useState('');
    const [selectedDate, setSelectedDate] = useState(getSriLankaDate());
    const [isPaymentLogOpen, setIsPaymentLogOpen] = useState(false);

    // Edit Payment State
    const [editingPayment, setEditingPayment] = useState<{ id: string, amount: string, date: string, notes: string } | null>(null);

    const handleDateChange = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    const todaysPayments = payments.filter(p => p.date === selectedDate);
    const totalPaidToday = todaysPayments.reduce((sum, p) => sum + p.amount, 0);

    // Calculation Logic
    const getFinancials = (employee: any) => {
        // ... (existing logic)
        // 1. Calculate Earned
        const empAttendance = attendance.filter(a => a.employeeId === employee.id);
        let totalEarned = 0;
        let totalHours = 0;

        empAttendance.forEach(record => {
            let recordEarned = 0;

            // Determine Daily Rate for this specific record
            const recordRole = record.role || employee.role;
            const roleData = employee.additionalRoles?.find((r: any) => r.role === recordRole);
            const applicableRate = roleData ? roleData.dailyRate : employee.dailyRate;

            // Precise Hourly Calculation (if available)
            if (record.workingHours !== undefined && record.workingHours !== null) {
                const hourlyRate = applicableRate / 10;
                recordEarned = hourlyRate * record.workingHours;
                totalHours += record.workingHours;
            }
            // Fallback Legacy Calculation
            else {
                if (record.status === 'present') {
                    recordEarned = applicableRate;
                    totalHours += 10;
                }
                if (record.status === 'half-day') {
                    recordEarned = applicableRate / 2;
                    totalHours += 5;
                }
            }
            totalEarned += recordEarned;
        });

        // 2. Calculate Paid
        const empPayments = payments.filter(p => p.employeeId === employee.id);
        const totalPaid = empPayments.reduce((acc, curr) => acc + curr.amount, 0);

        return {
            totalEarned,
            totalPaid,
            balance: totalEarned - totalPaid,
            totalHours,
            daysPresent: empAttendance.filter(a => a.status === 'present' || (a.workingHours && a.workingHours >= 10)).length,
        };
    };

    const handlePay = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee || !payAmount) return;

        addPayment({
            employeeId: selectedEmployee,
            amount: Number(payAmount),
            date: selectedDate, // Use selected date for payment
            notes: 'Manual Payment'
        });

        setSelectedEmployee(null);
        setPayAmount('');
    };

    const activeEmployee = selectedEmployee ? employees.find(e => e.id === selectedEmployee) : null;
    const detailsEmployee = viewDetailsEmployee ? employees.find(e => e.id === viewDetailsEmployee) : null;

    return (
        <div>
            <div className="page-header flex-col md:flex-row gap-4 items-start md:items-end">
                <div>
                    <h1 className="page-title">Salary & Payments</h1>
                    <p className="page-subtitle">Track earnings & daily payments</p>
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


            {/* Daily Payment Summary */}
            <div className="card mb-8 bg-blue-50 border-blue-100">
                <div
                    className="flex justify-between items-center cursor-pointer select-none"
                    onClick={() => setIsPaymentLogOpen(!isPaymentLogOpen)}
                >
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-blue-900">Payments on {selectedDate}</h2>
                        {isPaymentLogOpen ? <ChevronUp size={20} className="text-blue-700" /> : <ChevronDown size={20} className="text-blue-700" />}
                    </div>
                    <span className="text-2xl font-bold text-blue-700">${totalPaidToday.toLocaleString()}</span>
                </div>

                {isPaymentLogOpen && (
                    <div className="mt-4">
                        {todaysPayments.length > 0 ? (
                            <div className="bg-white rounded-lg border border-blue-100 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-blue-50/50 text-blue-900">
                                        <tr>
                                            <th className="p-3">Employee</th>
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
                                                    <td className="p-3 text-gray-500">{p.notes}</td>
                                                    <td className="p-3 text-right font-mono font-bold">${p.amount}</td>
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

            {employees.length === 0 ? (
                <div className="text-center py-12 text-gray-400">Add employees first.</div>
            ) : (
                <div className="dashboard-grid">
                    {employees.map(emp => {
                        const { totalEarned, totalPaid, balance, totalHours } = getFinancials(emp); // Destructure result
                        return (
                            <div key={emp.id} className="card">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-[var(--color-dark)]">{emp.name}</h3>
                                        <p className="text-sm text-[var(--color-text-muted)]">{emp.role}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-[var(--color-text-muted)]">Daily Rate</p>
                                        <p className="font-mono font-bold text-[var(--color-dark)]">${emp.dailyRate}</p>
                                    </div>
                                </div>

                                <div className="mb-6" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--color-text-muted)]">Total Hours</span>
                                        <span className="font-medium bg-blue-50 text-blue-700 px-2 rounded-full text-xs py-0.5">{totalHours.toFixed(1)} Hrs</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--color-text-muted)]">Total Earned</span>
                                        <span className="font-medium text-[var(--color-dark)]">${totalEarned.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--color-text-muted)]">Paid So Far</span>
                                        <span className="font-medium" style={{ color: 'var(--color-success)' }}>-${totalPaid.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-3 flex justify-between items-center" style={{ borderTop: '1px solid var(--color-border)' }}>
                                        <span className="font-bold text-[var(--color-dark)]">Balance Due</span>
                                        <span className="font-bold text-lg" style={{ color: balance > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                                            ${balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setViewDetailsEmployee(emp.id)}
                                        className="btn btn-outline flex-1"
                                        style={{ padding: '0.5rem' }}
                                    >
                                        <FileText size={18} />
                                        Details
                                    </button>
                                    <button
                                        onClick={() => setSelectedEmployee(emp.id)}
                                        className="btn btn-primary flex-1"
                                        style={{ padding: '0.5rem' }}
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
            }

            {/* Details Modal */}
            {
                detailsEmployee && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="card w-full max-w-2xl shadow-xl bg-white max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold">{detailsEmployee.name}</h2>
                                    <p className="text-sm text-[var(--color-text-muted)]">Full Attendance Sheet</p>
                                </div>
                                <button onClick={() => setViewDetailsEmployee(null)} className="p-2 hover:bg-gray-100 rounded-full">
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
                                            {attendance
                                                .filter(a => a.employeeId === detailsEmployee.id)
                                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                .map(record => {
                                                    let earned = 0;
                                                    let displayTime = '';

                                                    // Determine rate for this record
                                                    const recordRole = record.role || detailsEmployee.role;
                                                    const roleData = detailsEmployee.additionalRoles?.find((r: any) => r.role === recordRole);
                                                    const applicableRate = roleData ? roleData.dailyRate : detailsEmployee.dailyRate;

                                                    if (record.workingHours !== undefined) {
                                                        const hourlyRate = applicableRate / 10;
                                                        earned = hourlyRate * record.workingHours;
                                                        displayTime = `${record.workingHours} Hrs`;
                                                        if (record.startTime && record.endTime) {
                                                            displayTime += ` (${record.startTime} - ${record.endTime})`;
                                                        }
                                                    } else {
                                                        if (record.status === 'present') {
                                                            earned = applicableRate;
                                                            displayTime = 'Full Day (10h)';
                                                        }
                                                        if (record.status === 'half-day') {
                                                            earned = applicableRate / 2;
                                                            displayTime = 'Half Day (5h)';
                                                        }
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
                                                            <td className="text-right font-mono">${earned.toFixed(0)}</td>
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
                                                        <td className="text-sm text-[var(--color-text-muted)]">{payment.notes || '-'}</td>
                                                        <td className="text-right font-mono font-bold text-[var(--color-success)]">${payment.amount}</td>
                                                        <td className="text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => setEditingPayment({
                                                                    id: payment.id,
                                                                    amount: payment.amount.toString(),
                                                                    date: payment.date.split('T')[0],
                                                                    notes: payment.notes || ''
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
                        <div className="card w-full max-w-sm shadow-xl bg-white">
                            <h3 className="text-lg font-bold mb-4">Pay {activeEmployee.name}</h3>
                            {/* Same Payment Modal Content */}
                            <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
                                <div className="flex justify-between mb-1">
                                    <span className="text-gray-500">Current Dues:</span>
                                    <span className="font-bold">${getFinancials(activeEmployee).balance.toLocaleString()}</span>
                                </div>
                            </div>

                            <form onSubmit={handlePay}>
                                <div className="mb-4">
                                    <label className="label">Amount to Pay ($)</label>
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

                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedEmployee(null)}
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
                    <div className="card w-full max-w-sm shadow-xl bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Edit Payment</h3>
                            <button onClick={() => setEditingPayment(null)} className="p-1 hover:bg-gray-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if (editingPayment) {
                                updatePayment(editingPayment.id, {
                                    amount: Number(editingPayment.amount),
                                    date: editingPayment.date,
                                    notes: editingPayment.notes
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
                                <label className="label">Amount ($)</label>
                                <input
                                    type="number"
                                    className="input w-full"
                                    value={editingPayment.amount}
                                    onChange={e => setEditingPayment({ ...editingPayment, amount: e.target.value })}
                                    required
                                    min="0"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="label">Notes</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={editingPayment.notes}
                                    onChange={e => setEditingPayment({ ...editingPayment, notes: e.target.value })}
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
