'use client';

import { useRef, useState } from 'react';
import { useApp } from '@/lib/store';
import { BadgeDollarSign, Download, Edit, Filter, Loader2, Package, Paperclip, Plus, Search, Trash2, Wallet, X } from 'lucide-react';
import { DEFAULT_EXPENSE_CATEGORIES, Expense, ExpenseCategory, formatExpenseCategoryLabel } from '@/lib/types';
import { getSriLankaDate } from '@/lib/dateUtils';
import { downloadCSV } from '@/lib/exportUtils';
import { getAttachmentSignedUrl, removeAttachment, uploadAttachment, validateAttachmentFile } from '@/lib/storage';
import { formatCurrency } from '@/lib/currency';

const NEW_CATEGORY_OPTION = '__add_new__';

const KNOWN_BADGE_CLASSES: Record<string, string> = {
    materials: 'expense-category-materials',
    equipment: 'expense-category-equipment',
    subcontractor: 'expense-category-subcontractor',
    other: 'expense-category-other',
};

function categoryBadgeClass(category: string): string {
    return KNOWN_BADGE_CLASSES[category] || 'expense-category-custom';
}

type ExpenseFormState = {
    siteId: string;
    category: ExpenseCategory;
    description: string;
    amount: string;
    date: string;
    vendor: string;
    notes: string;
    receiptPath: string | undefined;
};

const emptyForm = (): ExpenseFormState => ({
    siteId: '',
    category: 'materials',
    description: '',
    amount: '',
    date: getSriLankaDate(),
    vendor: '',
    notes: '',
    receiptPath: undefined,
});

export default function ExpensesPage() {
    const { sites, expenses, user, addExpense, updateExpense, deleteExpense } = useApp();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [initialReceiptPath, setInitialReceiptPath] = useState<string | undefined>(undefined);
    const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const receiptInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState<ExpenseFormState>(emptyForm());

    const customCategories = Array.from(new Set(expenses.map(e => e.category)))
        .filter(cat => !(DEFAULT_EXPENSE_CATEGORIES as readonly string[]).includes(cat))
        .sort((a, b) => a.localeCompare(b));
    const knownCategories: string[] = [...DEFAULT_EXPENSE_CATEGORIES, ...customCategories];

    const [filterSite, setFilterSite] = useState('all');
    const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const resetForm = () => {
        setFormData(emptyForm());
        setEditingId(null);
        setInitialReceiptPath(undefined);
        setIsAddingCategory(false);
    };

    const handleOpenAdd = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleEdit = (expense: Expense) => {
        setEditingId(expense.id);
        setFormData({
            siteId: expense.siteId,
            category: expense.category,
            description: expense.description,
            amount: expense.amount.toString(),
            date: expense.date.split('T')[0],
            vendor: expense.vendor || '',
            notes: expense.notes || '',
            receiptPath: expense.receiptPath,
        });
        setInitialReceiptPath(expense.receiptPath);
        setIsAddingCategory(false);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        // If a new receipt was uploaded this session but never saved, clean it up.
        // The originally saved receipt (if any) is left untouched.
        if (formData.receiptPath && formData.receiptPath !== initialReceiptPath) {
            removeAttachment('expense-receipts', formData.receiptPath).catch(err => console.error('Error cleaning up unsaved receipt:', err));
        }
        setIsModalOpen(false);
        resetForm();
    };

    const handleReceiptChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !user) return;

        const validationError = validateAttachmentFile('expense-receipts', file);
        if (validationError) {
            alert(validationError);
            return;
        }

        // Clean up a previous not-yet-saved upload from this same modal session
        // (protecting the originally saved receipt, if any).
        if (formData.receiptPath && formData.receiptPath !== initialReceiptPath) {
            removeAttachment('expense-receipts', formData.receiptPath).catch(err => console.error('Error removing replaced receipt:', err));
        }

        setIsUploadingReceipt(true);
        try {
            const path = await uploadAttachment('expense-receipts', user.id, file);
            setFormData(prev => ({ ...prev, receiptPath: path }));
        } catch (err) {
            console.error('Error uploading receipt:', err);
            alert('Failed to upload receipt. Please try again.');
        } finally {
            setIsUploadingReceipt(false);
        }
    };

    const handleRemoveReceipt = () => {
        setFormData(prev => ({ ...prev, receiptPath: undefined }));
    };

    const handleOpenReceipt = async (path: string) => {
        // Deliberately no noopener/noreferrer on window.open: those make it return null,
        // and we need the reference to navigate the tab once the signed URL resolves.
        const newTab = window.open('', '_blank');
        const url = await getAttachmentSignedUrl('expense-receipts', path);
        if (url && newTab) {
            newTab.opener = null;
            newTab.location.href = url;
        } else {
            newTab?.close();
            alert('Could not load receipt. Please try again.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.siteId) return;

        const expenseData = {
            siteId: formData.siteId,
            category: formData.category.trim().toLowerCase(),
            description: formData.description,
            amount: Number(formData.amount),
            date: formData.date,
            vendor: formData.vendor || undefined,
            notes: formData.notes || undefined,
            receiptPath: formData.receiptPath,
        };

        let saved = true;
        if (editingId) {
            saved = await updateExpense(editingId, expenseData);
        } else {
            await addExpense(expenseData);
        }

        // Only clean up the old receipt once the DB write actually succeeded — otherwise
        // the DB still points at it (e.g. save failed) and deleting it here would leave
        // a broken reference.
        if (saved && initialReceiptPath && initialReceiptPath !== formData.receiptPath) {
            removeAttachment('expense-receipts', initialReceiptPath).catch(err => console.error('Error removing old receipt:', err));
        }

        setIsModalOpen(false);
        resetForm();
    };

    const handleDelete = (expense: Expense) => {
        if (!confirm(`Delete this ${formatExpenseCategoryLabel(expense.category).toLowerCase()} expense of ${formatCurrency(expense.amount)}?\n\nThis cannot be undone.`)) return;
        deleteExpense(expense.id);
    };

    const filteredExpenses = expenses
        .filter(e => filterSite === 'all' || e.siteId === filterSite)
        .filter(e => filterCategory === 'all' || e.category === filterCategory)
        .filter(e => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            const site = sites.find(s => s.id === e.siteId);
            return e.description.toLowerCase().includes(term) ||
                (e.vendor && e.vendor.toLowerCase().includes(term)) ||
                (site && site.name.toLowerCase().includes(term));
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalsByCategory = filteredExpenses.reduce<Record<ExpenseCategory, number>>((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
    }, { materials: 0, equipment: 0, subcontractor: 0, other: 0 });

    const handleExportCSV = () => {
        const rows: (string | number)[][] = filteredExpenses.map(e => [
            e.date.split('T')[0],
            sites.find(s => s.id === e.siteId)?.name || 'Unknown Site',
            formatExpenseCategoryLabel(e.category),
            e.description,
            e.vendor || '',
            e.amount.toFixed(2),
        ]);
        rows.push(['', '', '', '', 'Total', totalAmount.toFixed(2)]);

        downloadCSV(
            `expenses_${getSriLankaDate()}.csv`,
            ['Date', 'Site', 'Category', 'Description', 'Vendor', 'Amount'],
            rows
        );
    };

    return (
        <div className="shell expenses-page">
            <div className="page-header expenses-header">
                <div>
                    <div className="page-kicker">Costs</div>
                    <h1 className="page-title">Expenses</h1>
                    <p className="page-subtitle">Track materials, equipment, and subcontractor costs per site alongside labor.</p>
                </div>
                <button onClick={handleOpenAdd} className="btn btn-primary">
                    <Plus size={18} />
                    Add Expense
                </button>
            </div>

            <div className="insight-strip">
                <div className="insight-card">
                    <div>
                        <span>Total</span>
                        <strong>{formatCurrency(totalAmount)}</strong>
                    </div>
                    <div className="soft-icon primary">
                        <Wallet size={20} />
                    </div>
                </div>
                <div className="insight-card">
                    <div>
                        <span>Materials</span>
                        <strong>{formatCurrency(totalsByCategory.materials)}</strong>
                    </div>
                    <div className="soft-icon">
                        <Package size={20} />
                    </div>
                </div>
                <div className="insight-card">
                    <div>
                        <span>Equipment</span>
                        <strong>{formatCurrency(totalsByCategory.equipment)}</strong>
                    </div>
                    <div className="soft-icon info">
                        <Package size={20} />
                    </div>
                </div>
                <div className="insight-card">
                    <div>
                        <span>Subcontractor</span>
                        <strong>{formatCurrency(totalsByCategory.subcontractor)}</strong>
                    </div>
                    <div className="soft-icon warning">
                        <BadgeDollarSign size={20} />
                    </div>
                </div>
            </div>

            <div className="workbench-panel">
                <div className="workbench-header">
                    <div>
                        <h2 className="workbench-title">Expense Log</h2>
                        <p className="workbench-meta">Showing {filteredExpenses.length} of {expenses.length} expenses.</p>
                    </div>
                    <div className="expenses-filter-row">
                        <div className="search-box">
                            <Search size={18} className="text-[var(--color-text-muted)]" />
                            <input
                                type="text"
                                placeholder="Search description, vendor, or site..."
                                className="input"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select className="input" value={filterSite} onChange={e => setFilterSite(e.target.value)} aria-label="Filter by site">
                            <option value="all">All Sites</option>
                            {sites.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <select
                            className="input"
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value as ExpenseCategory | 'all')}
                            aria-label="Filter by category"
                        >
                            <option value="all">All Categories</option>
                            {knownCategories.map(cat => (
                                <option key={cat} value={cat}>{formatExpenseCategoryLabel(cat)}</option>
                            ))}
                        </select>
                        <button type="button" className="btn btn-outline btn-sm" onClick={handleExportCSV} disabled={filteredExpenses.length === 0}>
                            <Download size={16} />
                            Export CSV
                        </button>
                    </div>
                </div>

                <div className="workbench-body">
                    {expenses.length === 0 ? (
                        <div className="empty-state">
                            <div>
                                <Filter size={44} className="mx-auto" />
                                <h3>No expenses recorded yet</h3>
                                <p>Log a materials, equipment, or subcontractor cost to see it here.</p>
                            </div>
                        </div>
                    ) : filteredExpenses.length === 0 ? (
                        <div className="empty-state">
                            <div>
                                <Search size={44} className="mx-auto" />
                                <h3>No expenses match these filters</h3>
                                <p>Try a different site, category, or search term.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Site</th>
                                        <th>Category</th>
                                        <th>Description</th>
                                        <th>Vendor</th>
                                        <th className="text-right">Amount</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExpenses.map(expense => (
                                        <tr key={expense.id}>
                                            <td className="font-mono text-sm">{expense.date.split('T')[0]}</td>
                                            <td className="text-sm">{sites.find(s => s.id === expense.siteId)?.name || 'Unknown Site'}</td>
                                            <td>
                                                <span className={`payment-type-badge ${categoryBadgeClass(expense.category)}`}>
                                                    {formatExpenseCategoryLabel(expense.category)}
                                                </span>
                                            </td>
                                            <td className="text-sm">
                                                {expense.description}
                                                {expense.receiptPath && (
                                                    <button
                                                        type="button"
                                                        className="receipt-attachment-link ml-2"
                                                        onClick={() => handleOpenReceipt(expense.receiptPath!)}
                                                        title="View receipt"
                                                    >
                                                        <Paperclip size={12} />
                                                        Receipt
                                                    </button>
                                                )}
                                            </td>
                                            <td className="text-sm text-[var(--color-text-muted)]">{expense.vendor || '-'}</td>
                                            <td className="text-right font-mono font-bold">{formatCurrency(expense.amount)}</td>
                                            <td className="text-right flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(expense)}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Edit"
                                                    type="button"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(expense)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                    title="Delete"
                                                    type="button"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="modal-card">
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title">{editingId ? 'Edit Expense' : 'Add Expense'}</h2>
                                <p className="modal-subtitle">Log a materials, equipment, or subcontractor cost against a site.</p>
                            </div>
                            <button onClick={handleCloseModal} className="icon-button" type="button">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-field">
                                    <label className="label">Site</label>
                                    <select
                                        required
                                        className="input"
                                        value={formData.siteId}
                                        onChange={e => setFormData({ ...formData, siteId: e.target.value })}
                                    >
                                        <option value="" disabled>Select a site</option>
                                        {sites.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label className="label">Category</label>
                                    {isAddingCategory ? (
                                        <div className="flex gap-2">
                                            <input
                                                required
                                                autoFocus
                                                type="text"
                                                className="input"
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                placeholder="e.g. Fuel"
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline btn-sm"
                                                onClick={() => {
                                                    setIsAddingCategory(false);
                                                    setFormData(prev => ({ ...prev, category: knownCategories[0] }));
                                                }}
                                            >
                                                Back
                                            </button>
                                        </div>
                                    ) : (
                                        <select
                                            required
                                            className="input"
                                            value={formData.category}
                                            onChange={e => {
                                                if (e.target.value === NEW_CATEGORY_OPTION) {
                                                    setIsAddingCategory(true);
                                                    setFormData({ ...formData, category: '' });
                                                } else {
                                                    setFormData({ ...formData, category: e.target.value as ExpenseCategory });
                                                }
                                            }}
                                        >
                                            {knownCategories.map(cat => (
                                                <option key={cat} value={cat}>{formatExpenseCategoryLabel(cat)}</option>
                                            ))}
                                            <option value={NEW_CATEGORY_OPTION}>+ Add New Category</option>
                                        </select>
                                    )}
                                </div>
                            </div>

                            <div className="form-field">
                                <label className="label">Description</label>
                                <input
                                    required
                                    type="text"
                                    className="input"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="e.g. 50 bags of cement"
                                />
                            </div>

                            <div className="form-grid">
                                <div className="form-field">
                                    <label className="label">Amount</label>
                                    <input
                                        required
                                        type="number"
                                        className="input"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        placeholder="0.00"
                                        min="0"
                                    />
                                </div>
                                <div className="form-field">
                                    <label className="label">Date</label>
                                    <input
                                        required
                                        type="date"
                                        className="input"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-field">
                                <label className="label">Vendor / Supplier (Optional)</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.vendor}
                                    onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                                    placeholder="e.g. ABC Hardware"
                                />
                            </div>

                            <div className="form-field">
                                <label className="label">Notes (Optional)</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            <div className="form-field mb-4">
                                <label className="label">Receipt (Optional)</label>
                                <div className="receipt-upload-row">
                                    {formData.receiptPath && (
                                        <button
                                            type="button"
                                            className="receipt-attachment-link"
                                            onClick={() => handleOpenReceipt(formData.receiptPath!)}
                                        >
                                            <Paperclip size={14} />
                                            View current
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="btn btn-outline btn-sm"
                                        onClick={() => receiptInputRef.current?.click()}
                                        disabled={isUploadingReceipt}
                                    >
                                        {isUploadingReceipt ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                                        {formData.receiptPath ? 'Replace' : 'Attach'}
                                    </button>
                                    {formData.receiptPath && !isUploadingReceipt && (
                                        <button
                                            type="button"
                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                            onClick={handleRemoveReceipt}
                                            title="Remove receipt"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                                <input
                                    ref={receiptInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                    className="hidden"
                                    onChange={handleReceiptChange}
                                />
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={handleCloseModal} className="btn btn-outline">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? 'Save Changes' : 'Save Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
