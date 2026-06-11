'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { Plus, MapPin, Trash2, Building, Edit } from 'lucide-react';
import { Site } from '@/lib/types';

export default function SitesPage() {
    const { sites, addSite, updateSite, removeSite } = useApp();
    const [isAdding, setIsAdding] = useState(false);
    const [editingSite, setEditingSite] = useState<Site | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingSite) {
            updateSite(editingSite.id, {
                name: formData.name,
                location: formData.location
            });
        } else {
            addSite({
                name: formData.name,
                location: formData.location,
                active: true,
            });
        }

        setIsAdding(false);
        setEditingSite(null);
        setFormData({ name: '', location: '' });
    };

    const handleEdit = (site: Site) => {
        setEditingSite(site);
        setFormData({
            name: site.name,
            location: site.location
        });
        setIsAdding(true);
    };

    return (
        <div className="shell">
            <div className="page-header">
                <div>
                    <div className="page-kicker">Projects</div>
                    <h1 className="page-title">Sites</h1>
                    <p className="page-subtitle">Manage active job sites and location references for attendance.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingSite(null);
                        setFormData({ name: '', location: '' });
                        setIsAdding(true);
                    }}
                    className="btn btn-primary"
                >
                    <Plus size={18} />
                    Add Site
                </button>
            </div>

            {isAdding && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="modal-card max-w-md">
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title">{editingSite ? 'Edit Site' : 'Add New Site'}</h2>
                                <p className="modal-subtitle">Site names appear in attendance and reports.</p>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-field">
                                <label className="label">Site Name</label>
                                <input
                                    required
                                    type="text"
                                    className="input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Downtown Plaza"
                                />
                            </div>
                            <div className="form-field">
                                <label className="label">Location / Address</label>
                                <input
                                    required
                                    type="text"
                                    className="input"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g. 123 Main St"
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAdding(false);
                                        setEditingSite(null);
                                    }}
                                    className="btn btn-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    {editingSite ? 'Save Changes' : 'Save Site'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="dashboard-grid">
                {sites.length === 0 ? (
                    <div className="empty-state col-span-full">
                        <div>
                            <Building size={44} className="mx-auto" />
                            <h3>No sites yet</h3>
                            <p>Add a site before assigning daily attendance.</p>
                        </div>
                    </div>
                ) : (
                    sites.map(site => (
                        <div key={site.id} className="card card-interactive">
                            <div className="flex justify-between items-start mb-4">
                                <div className="min-w-0">
                                    <div className="soft-icon primary mb-3">
                                        <Building size={20} />
                                    </div>
                                    <h3 className="font-bold text-lg text-[var(--color-dark)]">{site.name}</h3>
                                    <div className="flex items-center gap-1 text-sm text-[var(--color-text-muted)] mt-1">
                                        <MapPin size={14} />
                                        <span>{site.location}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(site)}
                                        className="btn btn-info btn-icon"
                                        title="Edit"
                                        type="button"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => removeSite(site.id)}
                                        className="btn btn-danger btn-icon"
                                        title="Delete"
                                        type="button"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                                <span className={`badge ${site.active ? 'badge-active' : 'badge-inactive'}`}>
                                    {site.active ? 'Active Project' : 'Completed'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
