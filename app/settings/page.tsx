'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { Building2, CheckCircle2, Mail, Save, Settings, UserRound } from 'lucide-react';

export default function SettingsPage() {
    const { user, updateProfile } = useApp();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        companyName: user?.companyName || ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        setFormData({
            name: user?.name || '',
            companyName: user?.companyName || ''
        });
    }, [user]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setMessage('');
        setIsSaving(true);

        try {
            await updateProfile(formData);
            setMessage('Account details updated.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update account details.');
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = formData.name !== (user?.name || '') || formData.companyName !== (user?.companyName || '');

    return (
        <div className="shell">
            <header className="page-header">
                <div>
                    <div className="page-kicker">Workspace settings</div>
                    <h1 className="page-title">Account details</h1>
                    <p className="page-subtitle">Update the name and company name shown across SiteTrack.</p>
                </div>
            </header>

            <section className="settings-layout">
                <form onSubmit={handleSubmit} className="panel settings-form">
                    <div className="section-header mb-4">
                        <div>
                            <h2 className="text-xl font-bold">Edit profile</h2>
                            <p className="page-subtitle">These details appear in the top bar and workspace records.</p>
                        </div>
                        <div className="soft-icon primary">
                            <Settings size={20} />
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-field">
                            <label className="label" htmlFor="name">Full Name</label>
                            <div className="input-wrapper">
                                <input
                                    id="name"
                                    type="text"
                                    required
                                    className="input"
                                    value={formData.name}
                                    onChange={(event) => setFormData(prev => ({ ...prev, name: event.target.value }))}
                                    placeholder="Your name"
                                />
                                <span className="input-icon-btn" aria-hidden="true">
                                    <UserRound size={17} />
                                </span>
                            </div>
                        </div>

                        <div className="form-field">
                            <label className="label" htmlFor="companyName">Company Name</label>
                            <div className="input-wrapper">
                                <input
                                    id="companyName"
                                    type="text"
                                    required
                                    className="input"
                                    value={formData.companyName}
                                    onChange={(event) => setFormData(prev => ({ ...prev, companyName: event.target.value }))}
                                    placeholder="Company name"
                                />
                                <span className="input-icon-btn" aria-hidden="true">
                                    <Building2 size={17} />
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="form-field">
                        <label className="label" htmlFor="email">Email Address</label>
                        <div className="input-wrapper">
                            <input
                                id="email"
                                type="email"
                                className="input"
                                value={user?.email || ''}
                                readOnly
                            />
                            <span className="input-icon-btn" aria-hidden="true">
                                <Mail size={17} />
                            </span>
                        </div>
                        <p className="helper-text">Email changes are managed through authentication.</p>
                    </div>

                    {message && (
                        <div className="settings-alert success">
                            <CheckCircle2 size={18} />
                            <span>{message}</span>
                        </div>
                    )}

                    {error && (
                        <div className="settings-alert danger">
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="toolbar settings-actions">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSaving || !hasChanges}
                        >
                            <Save size={18} />
                            {isSaving ? 'Saving' : 'Save Changes'}
                        </button>
                    </div>
                </form>

                <aside className="panel settings-summary">
                    <div className="settings-avatar">
                        {user?.name.charAt(0)}
                    </div>
                    <h2>{user?.companyName}</h2>
                    <p>{user?.name}</p>

                    <div className="list-stack mt-6">
                        <div className="detail-row">
                            <span>Account email</span>
                            <strong>{user?.email}</strong>
                        </div>
                        <div className="divider" />
                        <div className="detail-row">
                            <span>Workspace name</span>
                            <strong>{user?.companyName}</strong>
                        </div>
                    </div>
                </aside>
            </section>
        </div>
    );
}
