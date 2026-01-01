'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { Plus, Search, User, Edit, Trash2, X } from 'lucide-react';
import { Employee } from '@/lib/types';

export default function EmployeesPage() {
    const { employees, addEmployee, updateEmployee, deleteEmployee } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        dailyRate: '',
        additionalRoles: [] as { role: string; dailyRate: number }[],
        joinedDate: new Date().toISOString().split('T')[0],
        phone: '',
        nic: ''
    });

    const resetForm = () => {
        setFormData({
            name: '',
            role: '',
            dailyRate: '',
            additionalRoles: [],
            joinedDate: new Date().toISOString().split('T')[0],
            phone: '',
            nic: ''
        });
        setEditingId(null);
    };

    const handleOpenAdd = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleEdit = (emp: Employee) => {
        setEditingId(emp.id);
        setFormData({
            name: emp.name,
            role: emp.role,
            dailyRate: emp.dailyRate.toString(),
            additionalRoles: emp.additionalRoles || [],
            joinedDate: emp.joinedDate.split('T')[0],
            phone: emp.phone || '',
            nic: emp.nic || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete ${name}?\n\nThis will PERMANENTLY delete all their history (Attendance, Salary, Payments). This action cannot be undone.`)) {
            await deleteEmployee(id);
        }
    };

    const handleAddRole = () => {
        setFormData(prev => ({
            ...prev,
            additionalRoles: [...prev.additionalRoles, { role: '', dailyRate: 0 }]
        }));
    };

    const handleRemoveRole = (index: number) => {
        setFormData(prev => ({
            ...prev,
            additionalRoles: prev.additionalRoles.filter((_, i) => i !== index)
        }));
    };

    const handleRoleChange = (index: number, field: 'role' | 'dailyRate', value: string | number) => {
        const newRoles = [...formData.additionalRoles];
        newRoles[index] = { ...newRoles[index], [field]: value };
        setFormData(prev => ({ ...prev, additionalRoles: newRoles }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingId) {
            // Update
            await updateEmployee(editingId, {
                name: formData.name,
                role: formData.role,
                dailyRate: Number(formData.dailyRate),
                additionalRoles: formData.additionalRoles,
                joinedDate: formData.joinedDate,
                phone: formData.phone,
                nic: formData.nic
            });
        } else {
            // Add
            await addEmployee({
                name: formData.name,
                role: formData.role,
                dailyRate: Number(formData.dailyRate),
                additionalRoles: formData.additionalRoles,
                joinedDate: formData.joinedDate,
                active: true,
                phone: formData.phone,
                nic: formData.nic
            });
        }

        setIsModalOpen(false);
        resetForm();
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.nic && emp.nic.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Employees</h1>
                    <p className="page-subtitle">Manage your workforce</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="btn btn-primary"
                >
                    <Plus size={18} />
                    Add Employee
                </button>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="card w-full max-w-md shadow-lg bg-white overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">{editingId ? 'Edit Employee' : 'Add New Employee'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="mb-4">
                                    <label className="label">Role / Designation</label>
                                    <input
                                        required
                                        type="text"
                                        className="input"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        placeholder="e.g. Mason"
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
                            </div>

                            {/* Secondary Roles Section */}
                            <div className="mb-4 border-t border-gray-100 pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="label text-sm font-semibold text-gray-500">Secondary Roles (Optional)</label>
                                    <button
                                        type="button"
                                        onClick={handleAddRole}
                                        className="btn btn-sm btn-primary flex items-center gap-1"
                                        style={{ backgroundColor: '#3B82F6', color: 'white', padding: '4px 8px', fontSize: '12px' }}
                                    >
                                        <Plus size={14} /> Add Role
                                    </button>
                                </div>
                                {formData.additionalRoles.map((role, index) => (
                                    <div key={index} className="flex gap-2 mb-2 items-center">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                placeholder="Role (e.g. Driver)"
                                                className="input text-sm w-full"
                                                value={role.role}
                                                onChange={e => handleRoleChange(index, 'role', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="w-24">
                                            <input
                                                type="number"
                                                placeholder="Rate"
                                                className="input text-sm w-full"
                                                value={role.dailyRate}
                                                onChange={e => handleRoleChange(index, 'dailyRate', Number(e.target.value))}
                                                required
                                                min="0"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveRole(index)}
                                            className="btn btn-sm"
                                            style={{ backgroundColor: '#FECACA', color: '#DC2626', padding: '8px', minWidth: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}
                                            title="Remove Role"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="mb-4">
                                <label className="label">Mobile Number</label>
                                <input
                                    required
                                    type="tel"
                                    className="input"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="e.g. 0771234567"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="label">NIC Number</label>
                                <input
                                    required
                                    type="text"
                                    className="input"
                                    value={formData.nic}
                                    onChange={e => setFormData({ ...formData, nic: e.target.value })}
                                    placeholder="e.g. 960981306v"
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
                                    onClick={() => setIsModalOpen(false)}
                                    className="btn btn-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    {editingId ? 'Update Employee' : 'Save Employee'}
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
                        placeholder="Search by name, role, or NIC..."
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
                                    <th>Mobile</th>
                                    <th>NIC</th>
                                    <th>Daily Rate</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'center', width: '140px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.map(emp => (
                                    <tr key={emp.id}>
                                        <td className="font-medium text-[var(--color-text-main)]">
                                            {emp.name}
                                            <div className="text-xs text-[var(--color-text-muted)] md:hidden">
                                                {emp.role}
                                                {emp.additionalRoles && emp.additionalRoles.length > 0 && (
                                                    <span className="text-xs ml-1 text-blue-600">
                                                        (+{emp.additionalRoles.length})
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-[var(--color-text-muted)] hidden md:table-cell">
                                            {emp.role}
                                            {emp.additionalRoles && emp.additionalRoles.length > 0 && (
                                                <div className="text-[10px] text-blue-600">
                                                    +{emp.additionalRoles.map(r => r.role).join(', ')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="text-[var(--color-text-muted)] font-mono text-sm">{emp.phone || '-'}</td>
                                        <td className="text-[var(--color-text-muted)] font-mono text-sm uppercase">{emp.nic || '-'}</td>
                                        <td className="text-[var(--color-text-main)] font-mono">${emp.dailyRate}</td>
                                        <td>
                                            <span className={`badge ${emp.active ? 'badge-active' : 'badge-inactive'}`}>
                                                {emp.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                                <button
                                                    onClick={() => handleEdit(emp)}
                                                    className="btn"
                                                    style={{ backgroundColor: '#3B82F6', color: 'white', padding: '8px', minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(emp.id, emp.name)}
                                                    className="btn"
                                                    style={{ backgroundColor: '#EF4444', color: 'white', padding: '8px', minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
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
