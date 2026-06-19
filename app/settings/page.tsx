'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Building2, CheckCircle2, Mail, Save, Settings, ShieldAlert, Trash2, UserRound } from 'lucide-react';

export default function SettingsPage() {
    const { user, updateProfile } = useApp();
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        companyName: user?.companyName || ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState('');
    const [deleteError, setDeleteError] = useState('');

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

    const handleDeleteAccount = async () => {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.access_token) {
            throw new Error(sessionError?.message || 'You must be signed in to delete your account.');
        }

        const response = await fetch('/api/account/delete', {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${session.access_token}`
            }
        });

        const result = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(result?.error || 'Failed to delete account.');
        }

        await supabase.auth.signOut();
        router.push('/login');
    };

    const handleConfirmDelete = async () => {
        setDeleteError('');
        setDeleteMessage('');
        setIsDeleting(true);

        try {
            await handleDeleteAccount();
            setIsDeleteModalOpen(false);
            setDeleteConfirmation('');
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Failed to delete account.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCloseDeleteModal = () => {
        if (isDeleting) return;

        setIsDeleteModalOpen(false);
        setDeleteConfirmation('');
        setDeleteError('');
    };

    const hasChanges = formData.name !== (user?.name || '') || formData.companyName !== (user?.companyName || '');
    const canDelete = deleteConfirmation === 'DELETE' && !isDeleting;

    return (
        <div className="shell settings-page">
            <header className="page-header settings-page-header">
                <div>
                    <div className="page-kicker">Workspace settings</div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Manage profile, company identity, and account safety for this FieldMetrik workspace.</p>
                </div>
            </header>

            <section className="settings-layout">
                <div className="settings-form">
                    <form onSubmit={handleSubmit} className="panel settings-form">
                        <div className="section-header mb-4">
                            <div>
                                <h2 className="text-xl font-bold">Profile & Company</h2>
                                <p className="page-subtitle">These details appear in the top bar and workspace records.</p>
                            </div>
                            <div className="soft-icon primary">
                                <Settings size={20} />
                            </div>
                        </div>

                        <div className="settings-section-label">Profile</div>
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

                        <div className="settings-section-label">Account</div>
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

                        <div className="toolbar settings-actions settings-save-row">
                            {hasChanges && (
                                <span className="settings-unsaved-note">Unsaved profile changes</span>
                            )}
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

                    <section className="panel settings-form settings-danger-zone">
                        <div className="section-header mb-4">
                            <div>
                                <div className="settings-section-label danger">Danger Zone</div>
                                <h2 className="text-xl font-bold text-danger">Delete Account</h2>
                                <p className="page-subtitle">
                                    Permanently delete your account and associated FieldMetrik data. Use this only when closing the workspace.
                                </p>
                            </div>
                            <div className="soft-icon danger">
                                <ShieldAlert size={20} />
                            </div>
                        </div>

                        {deleteMessage && (
                            <div className="settings-alert success">
                                <CheckCircle2 size={18} />
                                <span>{deleteMessage}</span>
                            </div>
                        )}

                        {deleteError && (
                            <div className="settings-alert danger">
                                <span>{deleteError}</span>
                            </div>
                        )}

                        <div className="toolbar settings-actions">
                            <button
                                type="button"
                                className="btn btn-danger-subtle"
                                onClick={() => {
                                    setDeleteError('');
                                    setDeleteMessage('');
                                    setIsDeleteModalOpen(true);
                                }}
                            >
                                <Trash2 size={18} />
                                Delete Account
                            </button>
                        </div>
                    </section>
                </div>

                <aside className="panel settings-summary">
                    <div className="settings-avatar">
                        {user?.name.charAt(0)}
                    </div>
                    <h2>{user?.companyName}</h2>
                    <p>{user?.name}</p>

                    <div className="list-stack mt-6">
                        <div className="settings-summary-chip">
                            <span>Workspace</span>
                            <strong>Active</strong>
                        </div>
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

            {isDeleteModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-card max-w-md">
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title text-danger">Delete Account</h2>
                                <p className="modal-subtitle">
                                    Account deletion is permanent and cannot be undone.
                                </p>
                            </div>
                            <div className="soft-icon danger">
                                <Trash2 size={20} />
                            </div>
                        </div>

                        <div className="list-stack">
                            <div className="settings-alert danger">
                                <span>
                                    This will permanently delete your account and associated FieldMetrik data.
                                </span>
                            </div>

                            <div className="form-field">
                                <label className="label" htmlFor="deleteConfirmation">
                                    Type DELETE to confirm
                                </label>
                                <input
                                    id="deleteConfirmation"
                                    type="text"
                                    className="input"
                                    value={deleteConfirmation}
                                    onChange={(event) => setDeleteConfirmation(event.target.value)}
                                    placeholder="DELETE"
                                    disabled={isDeleting}
                                />
                            </div>

                            {deleteError && (
                                <div className="settings-alert danger">
                                    <span>{deleteError}</span>
                                </div>
                            )}

                            <div className="toolbar settings-actions">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={handleCloseDeleteModal}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={handleConfirmDelete}
                                    disabled={!canDelete}
                                >
                                    <Trash2 size={18} />
                                    {isDeleting ? 'Deleting' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
