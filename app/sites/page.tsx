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
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Sites</h1>
                    <p className="page-subtitle">Manage construction sites</p>
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
                    <div className="card w-full max-w-md shadow-lg bg-white">
                        <h2 className="text-xl font-bold mb-4">{editingSite ? 'Edit Site' : 'Add New Site'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
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
                            <div className="mb-4">
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
                    <div className="text-center py-12 text-[var(--color-text-muted)] col-span-full">
                        <Building size={48} className="mx-auto mb-3 opacity-20" />
                        <p>No sites found. Add one to get started.</p>
                    </div>
                ) : (
                    sites.map(site => (
                        <div key={site.id} className="card">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-[var(--color-dark)]">{site.name}</h3>
                                    <div className="flex items-center gap-1 text-sm text-[var(--color-text-muted)] mt-1">
                                        <MapPin size={14} />
                                        <span>{site.location}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => handleEdit(site)}
                                        className="btn"
                                        style={{ backgroundColor: '#3B82F6', color: 'white', padding: '8px', minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Edit"
                                        type="button"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => removeSite(site.id)}
                                        className="btn"
                                        style={{ backgroundColor: '#EF4444', color: 'white', padding: '8px', minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
