'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { BadgeDollarSign, FileText, X } from 'lucide-react';

export default function SalaryPage() {
    const { employees, attendance, payments, addPayment, sites } = useApp();
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
    const [viewDetailsEmployee, setViewDetailsEmployee] = useState<string | null>(null);
    const [payAmount, setPayAmount] = useState('');

    // Calculation Logic
    const getFinancials = (employeeId: string, dailyRate: number) => {
        // 1. Calculate Earned
        const empAttendance = attendance.filter(a => a.employeeId === employeeId);
        let totalEarned = 0;

        empAttendance.forEach(record => {
            if (record.status === 'present') totalEarned += dailyRate;
            if (record.status === 'half-day') totalEarned += (dailyRate / 2);
        });

        // 2. Calculate Paid
        const empPayments = payments.filter(p => p.employeeId === employeeId);
        const totalPaid = empPayments.reduce((acc, curr) => acc + curr.amount, 0);

        return {
            totalEarned,
            totalPaid,
            balance: totalEarned - totalPaid,
            daysPresent: empAttendance.filter(a => a.status === 'present').length,
            daysHalf: empAttendance.filter(a => a.status === 'half-day').length,
        };
    };

    const handlePay = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee || !payAmount) return;

        addPayment({
            employeeId: selectedEmployee,
            amount: Number(payAmount),
            date: new Date().toISOString().split('T')[0],
            notes: 'Manual Payment'
        });

        setSelectedEmployee(null);
        setPayAmount('');
    };

    const activeEmployee = selectedEmployee ? employees.find(e => e.id === selectedEmployee) : null;
    const detailsEmployee = viewDetailsEmployee ? employees.find(e => e.id === viewDetailsEmployee) : null;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Salary & Payments</h1>
                    <p className="page-subtitle">Track earnings and settle dues</p>
                </div>
            </div>

            {employees.length === 0 ? (
                <div className="text-center py-12 text-gray-400">Add employees first.</div>
            ) : (
                <div className="dashboard-grid">
                    {employees.map(emp => {
                        const { totalEarned, totalPaid, balance, daysPresent, daysHalf } = getFinancials(emp.id, emp.dailyRate);

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
                                        <span className="text-[var(--color-text-muted)]">Attendance</span>
                                        <span className="font-medium">{daysPresent} Days + {daysHalf} Half</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--color-text-muted)]">Total Earned</span>
                                        <span className="font-medium text-[var(--color-dark)]">${totalEarned.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--color-text-muted)]">Paid So Far</span>
                                        <span className="font-medium" style={{ color: 'var(--color-success)' }}>-${totalPaid.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-3 flex justify-between items-center" style={{ borderTop: '1px solid var(--color-border)' }}>
                                        <span className="font-bold text-[var(--color-dark)]">Balance Due</span>
                                        <span className="font-bold text-lg" style={{ color: balance > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                                            ${balance.toLocaleString()}
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
            )}

            {/* Details Modal */}
            {detailsEmployee && (
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
                                            <th>Site</th>
                                            <th>Status</th>
                                            <th className="text-right">Earned</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendance
                                            .filter(a => a.employeeId === detailsEmployee.id)
                                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                            .map(record => {
                                                let earned = 0;
                                                if (record.status === 'present') earned = detailsEmployee.dailyRate;
                                                if (record.status === 'half-day') earned = detailsEmployee.dailyRate / 2;

                                                return (
                                                    <tr key={record.id}>
                                                        <td className="font-mono text-sm">{record.date.split('T')[0]}</td>
                                                        <td className="text-sm">
                                                            {record.site ? (sites.find(s => s.id === record.site)?.name || 'Unknown Site') : '-'}
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${record.status === 'present' ? 'badge-active' :
                                                                record.status === 'absent' ? 'badge-inactive' : 'bg-yellow-100 text-yellow-700'
                                                                }`}>
                                                                {record.status}
                                                            </span>
                                                        </td>
                                                        <td className="text-right font-mono">${earned}</td>
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
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments
                                            .filter(p => p.employeeId === detailsEmployee.id)
                                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                            .map(payment => (
                                                <tr key={payment.id}>
                                                    <td className="font-mono text-sm">{payment.date.split('T')[0]}</td>
                                                    <td className="text-sm text-[var(--color-text-muted)]">{payment.notes || '-'}</td>
                                                    <td className="text-right font-mono font-bold text-[var(--color-success)]">${payment.amount}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {selectedEmployee && activeEmployee && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="card w-full max-w-sm shadow-xl bg-white">
                        <h3 className="text-lg font-bold mb-4">Pay {activeEmployee.name}</h3>

                        <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
                            <div className="flex justify-between mb-1">
                                <span className="text-gray-500">Current Dues:</span>
                                <span className="font-bold">${getFinancials(activeEmployee.id, activeEmployee.dailyRate).balance}</span>
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
            )}
        </div>
    );
}
