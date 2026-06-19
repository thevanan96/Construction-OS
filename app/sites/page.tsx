'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useApp } from '@/lib/store';
import { Plus, MapPin, Building, Edit, PauseCircle, CheckCircle2, RotateCcw, PlayCircle, CalendarCheck, Clock, Users } from 'lucide-react';
import { Site } from '@/lib/types';
import { getAttendanceHours } from '@/lib/salary';

type SiteStatus = NonNullable<Site['status']>;
type SiteFilter = SiteStatus | 'all';

const STATUS_META: Record<SiteStatus, { label: string; badgeClass: string; cardClass: string }> = {
    active: {
        label: 'Active Project',
        badgeClass: 'badge-active',
        cardClass: 'site-card-active'
    },
    'on-hold': {
        label: 'On Hold',
        badgeClass: 'badge-warning',
        cardClass: 'site-card-on-hold'
    },
    completed: {
        label: 'Completed',
        badgeClass: 'badge-inactive',
        cardClass: 'site-card-completed'
    }
};

const getSiteStatus = (site: Site): SiteStatus => site.status || 'active';

export default function SitesPage() {
    const { sites, attendance, addSite, updateSite } = useApp();
    const [isAdding, setIsAdding] = useState(false);
    const [editingSite, setEditingSite] = useState<Site | null>(null);
    const [selectedFilter, setSelectedFilter] = useState<SiteFilter>('active');
    const [formData, setFormData] = useState({
        name: '',
        location: '',
    });

    const activeCount = sites.filter(site => getSiteStatus(site) === 'active').length;
    const onHoldCount = sites.filter(site => getSiteStatus(site) === 'on-hold').length;
    const completedCount = sites.filter(site => getSiteStatus(site) === 'completed').length;
    const today = new Date().toISOString().split('T')[0];
    const todaysAttendance = attendance.filter(record => record.date === today);
    const todaySiteHours = todaysAttendance.reduce((sum, record) => sum + getAttendanceHours(record), 0);
    const visibleSites = selectedFilter === 'all'
        ? sites
        : sites.filter(site => getSiteStatus(site) === selectedFilter);

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
                status: 'active',
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

    const updateSiteStatus = (site: Site, status: SiteStatus) => {
        const message = status === 'completed'
            ? 'Mark this site as completed? It will be hidden from new attendance selections but kept for old records.'
            : status === 'on-hold'
                ? 'Put this site on hold? It will be hidden from default active site selections.'
                : 'Move this site back to active projects?';

        if (!window.confirm(message)) return;

        updateSite(site.id, { status });
    };

    return (
        <div className="shell sites-page">
            <div className="page-header sites-header">
                <div>
                    <div className="page-kicker">Projects</div>
                    <h1 className="page-title">Sites</h1>
                    <p className="page-subtitle">Manage job sites, track today&apos;s staffing, and keep attendance locations clean.</p>
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

            <div className="site-summary">
                <SummaryChip label="Active" value={activeCount} tone="active" />
                <SummaryChip label="On Hold" value={onHoldCount} tone="hold" />
                <SummaryChip label="Completed" value={completedCount} tone="completed" />
                <SummaryChip label="Today Hours" value={Number(todaySiteHours.toFixed(1))} tone="hours" />
                <SummaryChip label="Total" value={sites.length} tone="total" />
            </div>

            <div className="site-filter-tabs sites-filter-tabs" role="tablist" aria-label="Filter sites by status">
                <button
                    type="button"
                    role="tab"
                    aria-selected={selectedFilter === 'active'}
                    className={`site-filter-tab ${selectedFilter === 'active' ? 'active' : ''}`}
                    onClick={() => setSelectedFilter('active')}
                >
                    Active
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={selectedFilter === 'on-hold'}
                    className={`site-filter-tab ${selectedFilter === 'on-hold' ? 'active' : ''}`}
                    onClick={() => setSelectedFilter('on-hold')}
                >
                    On Hold
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={selectedFilter === 'completed'}
                    className={`site-filter-tab ${selectedFilter === 'completed' ? 'active' : ''}`}
                    onClick={() => setSelectedFilter('completed')}
                >
                    Completed
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={selectedFilter === 'all'}
                    className={`site-filter-tab ${selectedFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedFilter('all')}
                >
                    All
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

            <div className="dashboard-grid sites-grid">
                {sites.length === 0 ? (
                    <div className="empty-state col-span-full">
                        <div>
                            <Building size={44} className="mx-auto" />
                            <h3>No sites yet</h3>
                            <p>Add a site before assigning daily attendance.</p>
                        </div>
                    </div>
                ) : visibleSites.length === 0 ? (
                    <div className="empty-state col-span-full">
                        <div>
                            <Building size={44} className="mx-auto" />
                            <h3>No {selectedFilter === 'all' ? '' : selectedFilter.replace('-', ' ')} sites</h3>
                            <p>Switch filters to review other project records.</p>
                        </div>
                    </div>
                ) : (
                    visibleSites.map(site => {
                        const status = getSiteStatus(site);
                        const meta = STATUS_META[status];
                        const siteRecords = todaysAttendance.filter(record => record.site === site.id);
                        const siteWorkers = new Set(siteRecords.map(record => record.employeeId)).size;
                        const siteHours = siteRecords.reduce((sum, record) => sum + getAttendanceHours(record), 0);

                        return (
                        <div key={site.id} className={`card card-interactive site-card ${meta.cardClass}`}>
                            <div className="site-card-top">
                                <div className="min-w-0">
                                    <div className={`soft-icon mb-3 ${status === 'active' ? 'primary' : status === 'completed' ? 'info' : 'warning'}`}>
                                        <Building size={20} />
                                    </div>
                                    <h3 className="font-bold text-lg text-[var(--color-dark)]">{site.name}</h3>
                                    <div className="flex items-center gap-1 text-sm text-[var(--color-text-muted)] mt-1">
                                        <MapPin size={14} />
                                        <span>{site.location}</span>
                                    </div>
                                </div>
                                <div className="site-card-edit">
                                    <button
                                        onClick={() => handleEdit(site)}
                                        className="btn btn-info btn-icon"
                                        title="Edit"
                                        type="button"
                                    >
                                        <Edit size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="site-operational-grid">
                                <div className="site-operational-tile">
                                    <Users size={15} />
                                    <span>Workers</span>
                                    <strong>{siteWorkers}</strong>
                                </div>
                                <div className="site-operational-tile">
                                    <Clock size={15} />
                                    <span>Hours</span>
                                    <strong>{siteHours.toFixed(1)}</strong>
                                </div>
                            </div>

                            <div className="site-status-row">
                                <span className={`badge ${meta.badgeClass}`}>
                                    {meta.label}
                                </span>
                            </div>

                            <div className="site-card-actions">
                                {status === 'active' && (
                                    <Link href="/attendance" className="btn btn-primary btn-sm">
                                        <CalendarCheck size={15} />
                                        Mark Attendance
                                    </Link>
                                )}
                                {status === 'active' && (
                                    <>
                                        <button
                                            type="button"
                                            className="btn btn-outline btn-sm"
                                            onClick={() => updateSiteStatus(site, 'on-hold')}
                                        >
                                            <PauseCircle size={15} />
                                            Mark On Hold
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-outline btn-sm"
                                            onClick={() => updateSiteStatus(site, 'completed')}
                                        >
                                            <CheckCircle2 size={15} />
                                            Mark Completed
                                        </button>
                                    </>
                                )}
                                {status === 'on-hold' && (
                                    <>
                                        <button
                                            type="button"
                                            className="btn btn-outline btn-sm"
                                            onClick={() => updateSiteStatus(site, 'active')}
                                        >
                                            <PlayCircle size={15} />
                                            Resume
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-outline btn-sm"
                                            onClick={() => updateSiteStatus(site, 'completed')}
                                        >
                                            <CheckCircle2 size={15} />
                                            Mark Completed
                                        </button>
                                    </>
                                )}
                                {status === 'completed' && (
                                    <button
                                        type="button"
                                        className="btn btn-outline btn-sm"
                                        onClick={() => updateSiteStatus(site, 'active')}
                                    >
                                        <RotateCcw size={15} />
                                        Reopen
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                    })
                )}
            </div>
        </div>
    );
}

function SummaryChip({ label, value, tone }: { label: string; value: number; tone: 'active' | 'hold' | 'completed' | 'hours' | 'total' }) {
    return (
        <div className={`site-summary-chip site-summary-${tone}`}>
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}
