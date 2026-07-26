'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { AlertTriangle, Boxes, Edit, History, Package, Plus, Search, Trash2, TrendingDown, TrendingUp, X } from 'lucide-react';
import { Material, MaterialTransactionType } from '@/lib/types';
import { getSriLankaDate } from '@/lib/dateUtils';

type MaterialFormState = {
    siteId: string;
    name: string;
    unit: string;
    reorderPoint: string;
    notes: string;
};

const emptyMaterialForm = (): MaterialFormState => ({
    siteId: '',
    name: '',
    unit: '',
    reorderPoint: '0',
    notes: '',
});

type TransactionFormState = {
    type: MaterialTransactionType;
    quantity: string;
    date: string;
    notes: string;
};

const emptyTransactionForm = (): TransactionFormState => ({
    type: 'received',
    quantity: '',
    date: getSriLankaDate(),
    notes: '',
});

const TRANSACTION_TYPE_LABELS: Record<MaterialTransactionType, string> = {
    received: 'Received',
    used: 'Used',
    adjustment: 'Adjustment',
};

function transactionBadgeClass(type: MaterialTransactionType): string {
    if (type === 'received') return 'status-badge-success';
    if (type === 'used') return 'status-badge-warning';
    return 'status-badge-neutral';
}

export default function MaterialsPage() {
    const {
        sites, materials, materialTransactions,
        addMaterial, updateMaterial, deleteMaterial,
        addMaterialTransaction, deleteMaterialTransaction,
    } = useApp();

    const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
    const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
    const [materialFormData, setMaterialFormData] = useState<MaterialFormState>(emptyMaterialForm());

    const [detailMaterialId, setDetailMaterialId] = useState<string | null>(null);
    const [transactionFormData, setTransactionFormData] = useState<TransactionFormState>(emptyTransactionForm());

    const [filterSite, setFilterSite] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const quantityOnHand = (materialId: string): number =>
        materialTransactions
            .filter(t => t.materialId === materialId)
            .reduce((sum, t) => sum + t.quantity, 0);

    const resetMaterialForm = () => {
        setMaterialFormData(emptyMaterialForm());
        setEditingMaterialId(null);
    };

    const handleOpenAddMaterial = () => {
        resetMaterialForm();
        setIsMaterialModalOpen(true);
    };

    const handleEditMaterial = (material: Material) => {
        setEditingMaterialId(material.id);
        setMaterialFormData({
            siteId: material.siteId,
            name: material.name,
            unit: material.unit,
            reorderPoint: material.reorderPoint.toString(),
            notes: material.notes || '',
        });
        setIsMaterialModalOpen(true);
    };

    const handleCloseMaterialModal = () => {
        setIsMaterialModalOpen(false);
        resetMaterialForm();
    };

    const handleSubmitMaterial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!materialFormData.siteId) return;

        const data = {
            siteId: materialFormData.siteId,
            name: materialFormData.name,
            unit: materialFormData.unit,
            reorderPoint: Number(materialFormData.reorderPoint) || 0,
            notes: materialFormData.notes || undefined,
        };

        if (editingMaterialId) {
            await updateMaterial(editingMaterialId, data);
        } else {
            await addMaterial(data);
        }

        setIsMaterialModalOpen(false);
        resetMaterialForm();
    };

    const handleDeleteMaterial = (material: Material) => {
        if (!confirm(`Delete "${material.name}" and its entire transaction history?\n\nThis cannot be undone.`)) return;
        deleteMaterial(material.id);
    };

    const detailMaterial = materials.find(m => m.id === detailMaterialId) || null;
    const detailTransactions = materialTransactions
        .filter(t => t.materialId === detailMaterialId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleOpenDetail = (material: Material) => {
        setDetailMaterialId(material.id);
        setTransactionFormData(emptyTransactionForm());
    };

    const handleCloseDetail = () => {
        setDetailMaterialId(null);
        setTransactionFormData(emptyTransactionForm());
    };

    const handleSubmitTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!detailMaterialId) return;

        const rawQuantity = Number(transactionFormData.quantity);
        if (!rawQuantity) return;

        const signedQuantity = transactionFormData.type === 'used'
            ? -Math.abs(rawQuantity)
            : transactionFormData.type === 'received'
                ? Math.abs(rawQuantity)
                : rawQuantity;

        await addMaterialTransaction({
            materialId: detailMaterialId,
            type: transactionFormData.type,
            quantity: signedQuantity,
            date: transactionFormData.date,
            notes: transactionFormData.notes || undefined,
        });

        setTransactionFormData(emptyTransactionForm());
    };

    const handleDeleteTransaction = (id: string) => {
        if (!confirm('Delete this transaction? This will change the quantity on hand.\n\nThis cannot be undone.')) return;
        deleteMaterialTransaction(id);
    };

    const filteredMaterials = materials
        .filter(m => filterSite === 'all' || m.siteId === filterSite)
        .filter(m => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            const site = sites.find(s => s.id === m.siteId);
            return m.name.toLowerCase().includes(term) || (site && site.name.toLowerCase().includes(term));
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    const lowStockCount = materials.filter(m => quantityOnHand(m.id) <= m.reorderPoint).length;
    const sitesTrackedCount = new Set(materials.map(m => m.siteId)).size;

    return (
        <div className="shell expenses-page">
            <div className="page-header expenses-header">
                <div>
                    <div className="page-kicker">Inventory</div>
                    <h1 className="page-title">Materials</h1>
                    <p className="page-subtitle">Track material stock per site with a full received/used transaction history.</p>
                </div>
                <button onClick={handleOpenAddMaterial} className="btn btn-primary">
                    <Plus size={18} />
                    Add Material
                </button>
            </div>

            <div className="insight-strip">
                <div className="insight-card">
                    <div>
                        <span>Total Materials</span>
                        <strong>{materials.length}</strong>
                    </div>
                    <div className="soft-icon primary">
                        <Boxes size={20} />
                    </div>
                </div>
                <div className="insight-card">
                    <div>
                        <span>Low Stock</span>
                        <strong>{lowStockCount}</strong>
                    </div>
                    <div className="soft-icon warning">
                        <AlertTriangle size={20} />
                    </div>
                </div>
                <div className="insight-card">
                    <div>
                        <span>Sites Tracked</span>
                        <strong>{sitesTrackedCount}</strong>
                    </div>
                    <div className="soft-icon info">
                        <Package size={20} />
                    </div>
                </div>
            </div>

            <div className="workbench-panel">
                <div className="workbench-header">
                    <div>
                        <h2 className="workbench-title">Material Stock</h2>
                        <p className="workbench-meta">Showing {filteredMaterials.length} of {materials.length} materials.</p>
                    </div>
                    <div className="expenses-filter-row">
                        <div className="search-box">
                            <Search size={18} className="text-[var(--color-text-muted)]" />
                            <input
                                type="text"
                                placeholder="Search material or site..."
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
                    </div>
                </div>

                <div className="workbench-body">
                    {materials.length === 0 ? (
                        <div className="empty-state">
                            <div>
                                <Boxes size={44} className="mx-auto" />
                                <h3>No materials tracked yet</h3>
                                <p>Add a material to start tracking stock for a site.</p>
                            </div>
                        </div>
                    ) : filteredMaterials.length === 0 ? (
                        <div className="empty-state">
                            <div>
                                <Search size={44} className="mx-auto" />
                                <h3>No materials match these filters</h3>
                                <p>Try a different site or search term.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Material</th>
                                        <th>Site</th>
                                        <th className="text-right">On Hand</th>
                                        <th className="text-right">Reorder Point</th>
                                        <th>Status</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMaterials.map(material => {
                                        const onHand = quantityOnHand(material.id);
                                        const isLowStock = onHand <= material.reorderPoint;
                                        return (
                                            <tr key={material.id}>
                                                <td className="text-sm font-bold">{material.name}</td>
                                                <td className="text-sm">{sites.find(s => s.id === material.siteId)?.name || 'Unknown Site'}</td>
                                                <td className="text-right font-mono">{onHand} {material.unit}</td>
                                                <td className="text-right font-mono text-[var(--color-text-muted)]">{material.reorderPoint} {material.unit}</td>
                                                <td>
                                                    <span className={`status-badge ${isLowStock ? 'status-badge-danger' : 'status-badge-success'}`}>
                                                        {isLowStock ? 'Low Stock' : 'In Stock'}
                                                    </span>
                                                </td>
                                                <td className="text-right flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenDetail(material)}
                                                        className="p-1 text-[var(--color-info)] hover:bg-[var(--color-info-soft)] rounded"
                                                        title="Transaction History"
                                                        type="button"
                                                    >
                                                        <History size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditMaterial(material)}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Edit"
                                                        type="button"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMaterial(material)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                        title="Delete"
                                                        type="button"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {isMaterialModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="modal-card">
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title">{editingMaterialId ? 'Edit Material' : 'Add Material'}</h2>
                                <p className="modal-subtitle">Define a material to track stock for at a site.</p>
                            </div>
                            <button onClick={handleCloseMaterialModal} className="icon-button" type="button">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitMaterial}>
                            <div className="form-field">
                                <label className="label">Site</label>
                                <select
                                    required
                                    className="input"
                                    value={materialFormData.siteId}
                                    onChange={e => setMaterialFormData({ ...materialFormData, siteId: e.target.value })}
                                >
                                    <option value="" disabled>Select a site</option>
                                    {sites.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-field">
                                <label className="label">Material Name</label>
                                <input
                                    required
                                    type="text"
                                    className="input"
                                    value={materialFormData.name}
                                    onChange={e => setMaterialFormData({ ...materialFormData, name: e.target.value })}
                                    placeholder="e.g. Cement"
                                />
                            </div>

                            <div className="form-grid">
                                <div className="form-field">
                                    <label className="label">Unit</label>
                                    <input
                                        required
                                        type="text"
                                        className="input"
                                        value={materialFormData.unit}
                                        onChange={e => setMaterialFormData({ ...materialFormData, unit: e.target.value })}
                                        placeholder="e.g. bags, kg, m³"
                                    />
                                </div>
                                <div className="form-field">
                                    <label className="label">Reorder Point</label>
                                    <input
                                        required
                                        type="number"
                                        className="input"
                                        value={materialFormData.reorderPoint}
                                        onChange={e => setMaterialFormData({ ...materialFormData, reorderPoint: e.target.value })}
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="form-field mb-4">
                                <label className="label">Notes (Optional)</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={materialFormData.notes}
                                    onChange={e => setMaterialFormData({ ...materialFormData, notes: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={handleCloseMaterialModal} className="btn btn-outline">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingMaterialId ? 'Save Changes' : 'Save Material'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {detailMaterial && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="modal-card max-w-2xl">
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title">{detailMaterial.name}</h2>
                                <p className="modal-subtitle">
                                    {sites.find(s => s.id === detailMaterial.siteId)?.name || 'Unknown Site'} · On hand: {quantityOnHand(detailMaterial.id)} {detailMaterial.unit}
                                </p>
                            </div>
                            <button onClick={handleCloseDetail} className="icon-button" type="button">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitTransaction} className="form-grid material-transaction-form">
                            <div className="form-field">
                                <label className="label">Type</label>
                                <select
                                    className="input"
                                    value={transactionFormData.type}
                                    onChange={e => setTransactionFormData({ ...transactionFormData, type: e.target.value as MaterialTransactionType })}
                                >
                                    <option value="received">Received</option>
                                    <option value="used">Used</option>
                                    <option value="adjustment">Adjustment</option>
                                </select>
                            </div>
                            <div className="form-field">
                                <label className="label">Quantity</label>
                                <input
                                    required
                                    type="number"
                                    step="any"
                                    className="input"
                                    value={transactionFormData.quantity}
                                    onChange={e => setTransactionFormData({ ...transactionFormData, quantity: e.target.value })}
                                    placeholder={transactionFormData.type === 'adjustment' ? 'e.g. -5 or 5' : '0'}
                                />
                            </div>
                            <div className="form-field">
                                <label className="label">Date</label>
                                <input
                                    required
                                    type="date"
                                    className="input"
                                    value={transactionFormData.date}
                                    onChange={e => setTransactionFormData({ ...transactionFormData, date: e.target.value })}
                                />
                            </div>
                            <div className="form-field">
                                <label className="label">Notes (Optional)</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={transactionFormData.notes}
                                    onChange={e => setTransactionFormData({ ...transactionFormData, notes: e.target.value })}
                                />
                            </div>
                            <div className="form-field material-transaction-submit">
                                <label className="label">&nbsp;</label>
                                <button type="submit" className="btn btn-primary w-full">
                                    {transactionFormData.type === 'used' ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                                    Log Transaction
                                </button>
                            </div>
                        </form>

                        <div className="table-container">
                            {detailTransactions.length === 0 ? (
                                <div className="empty-state">
                                    <div>
                                        <History size={44} className="mx-auto" />
                                        <h3>No transactions yet</h3>
                                        <p>Log a received, used, or adjustment entry above.</p>
                                    </div>
                                </div>
                            ) : (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th className="text-right">Quantity</th>
                                            <th>Notes</th>
                                            <th className="text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detailTransactions.map(txn => (
                                            <tr key={txn.id}>
                                                <td className="font-mono text-sm">{txn.date.split('T')[0]}</td>
                                                <td>
                                                    <span className={`status-badge ${transactionBadgeClass(txn.type)}`}>
                                                        {TRANSACTION_TYPE_LABELS[txn.type]}
                                                    </span>
                                                </td>
                                                <td className="text-right font-mono">
                                                    {txn.quantity > 0 ? '+' : ''}{txn.quantity} {detailMaterial.unit}
                                                </td>
                                                <td className="text-sm text-[var(--color-text-muted)]">{txn.notes || '-'}</td>
                                                <td className="text-right">
                                                    <button
                                                        onClick={() => handleDeleteTransaction(txn.id)}
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
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
