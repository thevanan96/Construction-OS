'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { BadgeCheck, BriefcaseBusiness, Edit, Phone, Plus, Search, Trash2, TrendingUp, User, Users, X } from 'lucide-react';
import { Employee } from '@/lib/types';

export default function EmployeesPage() {
    const { employees, addEmployee, updateEmployee, deleteEmployee } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    // Increment Modal State
    const [showIncrementModal, setShowIncrementModal] = useState(false);
    const [incrementData, setIncrementData] = useState({
        employeeId: '', // Added to track which employee is being incremented
        roleName: '', // 'primary' or specific role name
        currentRate: 0,
        newRate: 0,
        effectiveDate: new Date().toISOString().split('T')[0]
    });

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        dailyRate: '',
        rateHistory: [] as { rate: number; effectiveDate: string }[], // Added rateHistory
        additionalRoles: [] as { role: string; dailyRate: number; rateHistory?: { rate: number; effectiveDate: string }[] }[], // Added rateHistory to additional roles
        joinedDate: new Date().toISOString().split('T')[0],
        phone: '',
        nic: ''
    });

    const resetForm = () => {
        setFormData({
            name: '',
            role: '',
            dailyRate: '',
            rateHistory: [], // Reset rateHistory
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
            rateHistory: emp.rateHistory || [], // Load rateHistory
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
            additionalRoles: [...prev.additionalRoles, { role: '', dailyRate: 0, rateHistory: [] }]
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

        const employeeData = {
            name: formData.name,
            role: formData.role,
            dailyRate: Number(formData.dailyRate),
            rateHistory: formData.rateHistory, // Include rateHistory
            additionalRoles: formData.additionalRoles,
            joinedDate: formData.joinedDate,
            phone: formData.phone,
            nic: formData.nic
        };

        if (editingId) {
            // Update
            await updateEmployee(editingId, employeeData);
        } else {
            // Add
            await addEmployee({
                ...employeeData,
                active: true,
            });
        }

        setIsModalOpen(false);
        resetForm();
    };

    const openIncrementModal = (employeeId: string, roleName: string, currentRate: number) => {
        setIncrementData({
            employeeId,
            roleName,
            currentRate,
            newRate: currentRate,
            effectiveDate: new Date().toISOString().split('T')[0]
        });
        setShowIncrementModal(true);
    };

    const handleSaveIncrement = async () => {
        const { employeeId, roleName, newRate, effectiveDate } = incrementData;
        const newRateNum = Number(newRate);

        // Find the employee to update
        const employeeToUpdate = employees.find(emp => emp.id === employeeId);
        if (!employeeToUpdate) {
            console.error("Employee not found for increment.");
            setShowIncrementModal(false);
            return;
        }

        const newEntry = { rate: newRateNum, effectiveDate };
        let updatedEmployee = { ...employeeToUpdate };

        if (roleName === 'primary') {
            const currentHistory = [...(updatedEmployee.rateHistory || [])];

            // Backfill current rate if history is empty
            if (currentHistory.length === 0) {
                currentHistory.push({
                    rate: updatedEmployee.dailyRate,
                    effectiveDate: updatedEmployee.joinedDate // Assume initial rate started on join date
                });
            }

            const updatedHistory = [...currentHistory, newEntry];
            const isEffectiveNow = new Date(effectiveDate) <= new Date();
            updatedEmployee = {
                ...updatedEmployee,
                rateHistory: updatedHistory,
                dailyRate: isEffectiveNow ? newRateNum : updatedEmployee.dailyRate
            };
        } else {
            // Update Secondary Role
            const updatedRoles = (updatedEmployee.additionalRoles || []).map(r => {
                if (r.role === roleName) {
                    const currentHistory = [...(r.rateHistory || [])];

                    // Backfill current rate for role if history is empty
                    if (currentHistory.length === 0) {
                        currentHistory.push({
                            rate: r.dailyRate,
                            effectiveDate: updatedEmployee.joinedDate // Use employee join date as fallback for role start
                        });
                    }

                    const updatedHistory = [...currentHistory, newEntry];
                    const isEffectiveNow = new Date(effectiveDate) <= new Date();
                    return {
                        ...r,
                        rateHistory: updatedHistory,
                        dailyRate: isEffectiveNow ? newRateNum : r.dailyRate
                    };
                }
                return r;
            });
            updatedEmployee = { ...updatedEmployee, additionalRoles: updatedRoles };
        }

        await updateEmployee(employeeId, updatedEmployee);

        // Update local form data if we are currently editing this employee
        if (editingId === employeeId) {
            const isPrimary = roleName === 'primary';
            const isEffectiveNow = new Date(effectiveDate) <= new Date();

            if (isEffectiveNow) {
                if (isPrimary) {
                    setFormData(prev => ({ ...prev, dailyRate: newRateNum.toString(), rateHistory: updatedEmployee.rateHistory || [] }));
                } else {
                    setFormData(prev => ({ ...prev, additionalRoles: updatedEmployee.additionalRoles || [] }));
                }
            } else {
                // If future date, still update the background data structure (history) so another save doesn't overwrite it
                if (isPrimary) {
                    setFormData(prev => ({ ...prev, rateHistory: updatedEmployee.rateHistory || [] }));
                } else {
                    setFormData(prev => ({ ...prev, additionalRoles: updatedEmployee.additionalRoles || [] }));
                }
            }
        }

        setShowIncrementModal(false);
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.nic && emp.nic.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const activeEmployees = employees.filter(emp => emp.active).length;
    const totalRoles = employees.reduce((count, emp) => count + 1 + (emp.additionalRoles?.length || 0), 0);
    const averageRate = employees.length
        ? Math.round(employees.reduce((sum, emp) => sum + emp.dailyRate, 0) / employees.length)
        : 0;

    return (
        <div className="shell">
            <div className="page-header">
                <div>
                    <div className="page-kicker">Workforce</div>
                    <h1 className="page-title">Employees</h1>
                    <p className="page-subtitle">Manage worker profiles, roles, rates, and contact records.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="btn btn-primary"
                >
                    <Plus size={18} />
                    Add Employee
                </button>
            </div>

            <div className="insight-strip">
                <div className="insight-card">
                    <div>
                        <span>Total Employees</span>
                        <strong>{employees.length}</strong>
                    </div>
                    <div className="soft-icon">
                        <Users size={20} />
                    </div>
                </div>
                <div className="insight-card">
                    <div>
                        <span>Active Workforce</span>
                        <strong>{activeEmployees}</strong>
                    </div>
                    <div className="soft-icon">
                        <BadgeCheck size={20} />
                    </div>
                </div>
                <div className="insight-card">
                    <div>
                        <span>Roles Tracked</span>
                        <strong>{totalRoles}</strong>
                    </div>
                    <div className="soft-icon info">
                        <BriefcaseBusiness size={20} />
                    </div>
                </div>
                <div className="insight-card">
                    <div>
                        <span>Average Daily Rate</span>
                        <strong>{averageRate}</strong>
                    </div>
                    <div className="soft-icon primary">
                        <TrendingUp size={20} />
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="modal-card">
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title">{editingId ? 'Edit Employee' : 'Add New Employee'}</h2>
                                <p className="modal-subtitle">Keep workforce records accurate for attendance and payroll.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="icon-button" type="button">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-field">
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

                            <div className="form-grid">
                                <div className="form-field">
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
                                <div className="form-field">
                                    <label className="label">Daily Rate</label>
                                    <div className="flex gap-2">
                                        <input
                                            required
                                            type="number"
                                            className="input w-full"
                                            value={formData.dailyRate}
                                            onChange={e => setFormData({ ...formData, dailyRate: e.target.value })}
                                            placeholder="50"
                                            min="0"
                                        />
                                        {editingId && (
                                            <button
                                                type="button"
                                                onClick={() => openIncrementModal(editingId, 'primary', Number(formData.dailyRate))}
                                                className="btn btn-sm btn-outline text-blue-600 border-blue-200 hover:bg-blue-50 px-2"
                                                title="Add Increment"
                                            >
                                                <TrendingUp size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Secondary Roles Section */}
                            <div className="form-field border-t border-gray-100 pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="label text-sm font-semibold text-gray-500">Secondary Roles (Optional)</label>
                                    <button
                                        type="button"
                                        onClick={handleAddRole}
                                        className="btn btn-sm btn-info flex items-center gap-1 text-xs"
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
                                        <div className="w-32">
                                            <label className="text-xs text-gray-500 mb-1 block">Daily Rate</label>
                                            <div className="flex gap-1">
                                                <input
                                                    type="number"
                                                    placeholder="Rate"
                                                    className="input text-sm w-full bg-white"
                                                    value={role.dailyRate}
                                                    onChange={e => handleRoleChange(index, 'dailyRate', Number(e.target.value))}
                                                    required
                                                    min="0"
                                                />
                                                {editingId && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openIncrementModal(editingId, role.role, role.dailyRate)}
                                                        className="btn btn-sm text-blue-600 hover:bg-blue-50 px-1 h-9 rounded border border-gray-200 bg-white"
                                                        title="Add Increment"
                                                    >
                                                        <TrendingUp size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveRole(index)}
                                            className="btn btn-sm btn-danger-subtle btn-icon"
                                            title="Remove Role"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="form-field">
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

                            <div className="form-field">
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

                            <div className="form-field">
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

            {/* Increment Modal */}
            {showIncrementModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
                    <div className="modal-card max-w-sm">
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">Add Rate Increment</h3>
                                <p className="modal-subtitle">
                                    {incrementData.roleName === 'primary' ? 'Primary Role' : incrementData.roleName}
                                </p>
                            </div>
                        </div>

                        <div className="form-field">
                            <label className="label">New Daily Rate</label>
                            <input
                                type="number"
                                className="input text-lg font-bold"
                                value={incrementData.newRate}
                                onChange={e => setIncrementData({ ...incrementData, newRate: Number(e.target.value) })}
                                autoFocus
                            />
                            <p className="helper-text">Current rate: {incrementData.currentRate}</p>
                        </div>

                        <div className="form-field mb-6">
                            <label className="label">Effective From</label>
                            <input
                                type="date"
                                className="input"
                                value={incrementData.effectiveDate}
                                onChange={e => setIncrementData({ ...incrementData, effectiveDate: e.target.value })}
                            />
                            <p className="text-xs text-gray-400 mt-1">Changes will apply to attendance marked on or after this date.</p>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowIncrementModal(false)}
                                className="btn btn-outline"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveIncrement}
                                className="btn btn-primary"
                                disabled={incrementData.newRate <= 0}
                            >
                                Save Increment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="workbench-panel mb-6">
                <div className="workbench-header">
                    <div>
                        <h2 className="workbench-title">Workforce Directory</h2>
                        <p className="workbench-meta">
                            Showing {filteredEmployees.length} of {employees.length} employees
                        </p>
                    </div>
                    <div className="search-box" style={{ minWidth: 320 }}>
                        <Search size={18} className="text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search name, role, or NIC..."
                            className="input"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="workbench-body">
                    {filteredEmployees.length === 0 ? (
                        <div className="empty-state">
                        <div>
                            <User size={44} className="mx-auto" />
                            <h3>No employees found</h3>
                            <p>Add your first worker or adjust the search term.</p>
                        </div>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Roles</th>
                                        <th>Contact</th>
                                        <th>Daily Rate</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'center', width: '140px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEmployees.map(emp => (
                                        <tr key={emp.id}>
                                            <td>
                                                <div className="employee-cell">
                                                    <div className="avatar-sm">{emp.name.charAt(0).toUpperCase()}</div>
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-[var(--color-text-main)]">{emp.name}</div>
                                                        <div className="subtle-line">Joined {emp.joinedDate.split('T')[0]}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="pill-row">
                                                    <span className="role-pill">{emp.role}</span>
                                                    {emp.additionalRoles?.map(role => (
                                                        <span key={role.role} className="role-pill">{role.role}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="subtle-stack">
                                                    <div className="subtle-line">
                                                        <Phone size={13} />
                                                        <span className="font-mono">{emp.phone || 'No phone'}</span>
                                                    </div>
                                                    <div className="subtle-line">
                                                        <span>NIC</span>
                                                        <span className="font-mono uppercase">{emp.nic || '-'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="rate-chip">
                                                    <span>Rate</span>
                                                    {emp.dailyRate}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${emp.active ? 'badge-active' : 'badge-inactive'}`}>
                                                    {emp.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(emp)}
                                                        className="btn btn-info btn-icon"
                                                        title="Edit employee"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(emp.id, emp.name)}
                                                        className="btn btn-danger btn-icon"
                                                        title="Delete employee"
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
        </div>
    );
}
