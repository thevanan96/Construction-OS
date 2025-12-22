'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { Plus, Search, User } from 'lucide-react';

export default function EmployeesPage() {
    const { employees, addEmployee } = useApp();
    const [isAdding, setIsAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        dailyRate: '',
        joinedDate: new Date().toISOString().split('T')[0],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submitting employee form...');
        await addEmployee({
            name: formData.name,
            role: formData.role,
            dailyRate: Number(formData.dailyRate),
            joinedDate: formData.joinedDate,
            active: true,
        });
        setIsAdding(false);
        setFormData({ name: '', role: '', dailyRate: '', joinedDate: new Date().toISOString().split('T')[0] });
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Employees</h1>
                    <p className="page-subtitle">Manage your workforce</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="btn btn-primary"
                >
                    <Plus size={18} />
                    Add Employee
                </button>
            </div>

            {isAdding && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="card w-full max-w-md shadow-lg bg-white">
                        <h2 className="text-xl font-bold mb-4">Add New Employee</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="label">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    className="input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="label">Role / Designation</label>
                                <input
                                    required
                                    type="text"
                                    className="input"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    placeholder="e.g. Mason, Laborer"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="label">Daily Rate ($)</label>
                                <input
                                    required
                                    type="number"
                                    className="input"
                                    value={formData.dailyRate}
                                    onChange={e => setFormData({ ...formData, dailyRate: e.target.value })}
                                    placeholder="50"
                                    min="0"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="label">Joining Date</label>
                                <input
                                    required
                                    type="date"
                                    className="input"
                                    value={formData.joinedDate}
                                    onChange={e => setFormData({ ...formData, joinedDate: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="btn btn-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    Save Employee
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="card mb-6">
                <div className="flex items-center gap-2 mb-4 p-2 rounded border border-[var(--color-border)]">
                    <Search size={18} className="text-[var(--color-text-muted)]" />
                    <input
                        type="text"
                        placeholder="Search employees..."
                        className="input border-none bg-transparent p-0 focus:outline-none"
                        style={{ border: 'none' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {filteredEmployees.length === 0 ? (
                    <div className="text-center py-12 text-[var(--color-text-muted)]">
                        <User size={48} className="mx-auto mb-3 opacity-20" />
                        <p>No employees found. Add one to get started.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Daily Rate</th>
                                    <th>Joined</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.map(emp => (
                                    <tr key={emp.id}>
                                        <td className="font-medium text-[var(--color-text-main)]">{emp.name}</td>
                                        <td className="text-[var(--color-text-muted)]">{emp.role}</td>
                                        <td className="text-[var(--color-text-main)] font-mono">${emp.dailyRate}</td>
                                        <td>{emp.joinedDate.split('T')[0]}</td>
                                        <td>
                                            <span className={`badge ${emp.active ? 'badge-active' : 'badge-inactive'}`}>
                                                {emp.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
