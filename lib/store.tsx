'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Employee, Attendance, AttendanceStatus, Payment, Site, User } from './types';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';
import { dequeue, enqueue, isNetworkFailure, loadQueue } from './offlineQueue';

type StoredRole = {
    role: string;
    dailyRate: number;
    rateHistory?: { rate: number; effectiveDate: string }[];
};

interface AppContextType {
    employees: Employee[];
    attendance: Attendance[];
    payments: Payment[];
    sites: Site[];
    user: User | null;
    isLoading: boolean;
    isOffline: boolean;
    pendingSyncCount: number;
    addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
    updateEmployee: (id: string, data: Partial<Employee>) => Promise<void>;
    deleteEmployee: (id: string) => Promise<void>;
    markAttendance: (record: Omit<Attendance, 'id'>) => Promise<void>;
    addAttendanceSegment: (record: Omit<Attendance, 'id'>) => Promise<void>;
    updateAttendanceSegment: (id: string, data: Partial<Attendance>) => Promise<void>;
    deleteAttendanceSegment: (id: string) => Promise<void>;
    addPayment: (payment: Omit<Payment, 'id'>) => Promise<void>;
    updatePayment: (id: string, data: Partial<Payment>) => Promise<void>;
    deletePayment: (id: string) => Promise<void>;
    addSite: (site: Omit<Site, 'id'>) => Promise<void>;
    updateSite: (id: string, data: Partial<Site>) => Promise<void>;
    removeSite: (id: string) => Promise<void>;
    updateProfile: (data: Pick<User, 'name' | 'companyName'>) => Promise<void>;
    logout: () => void;
}

type EmployeeRow = {
    id: string;
    name: string;
    role: string;
    daily_rate: number;
    rate_history?: { rate: number; effectiveDate: string }[] | null;
    additional_roles?: StoredRole[] | null;
    joined_date: string;
    status?: string;
    phone?: string;
    nic?: string;
};

function mapEmployeeRow(e: EmployeeRow): Employee {
    return {
        id: e.id,
        name: e.name,
        role: e.role,
        dailyRate: e.daily_rate,
        rateHistory: e.rate_history || [],
        additionalRoles: ((e.additional_roles || []) as StoredRole[]).map((r) => ({
            ...r,
            rateHistory: r.rateHistory || []
        })),
        joinedDate: e.joined_date,
        active: e.status === 'active',
        phone: e.phone,
        nic: e.nic
    };
}

type SiteRow = {
    id: string;
    name: string;
    location: string;
    status?: 'active' | 'completed' | 'on-hold';
};

function mapSiteRow(s: SiteRow): Site {
    return {
        id: s.id,
        name: s.name,
        location: s.location,
        status: s.status || 'active'
    };
}

type AttendanceRow = {
    id: string;
    employee_id: string;
    date: string;
    created_at?: string;
    status: AttendanceStatus;
    role?: string;
    site_id?: string;
    start_time?: string;
    end_time?: string;
    working_hours?: number;
};

function mapAttendanceRow(a: AttendanceRow): Attendance {
    return {
        id: a.id,
        employeeId: a.employee_id,
        date: a.date,
        createdAt: a.created_at,
        status: a.status,
        role: a.role,
        site: a.site_id,
        startTime: a.start_time,
        endTime: a.end_time,
        workingHours: a.working_hours
    };
}

type PaymentRow = {
    id: string;
    employee_id: string;
    amount: number;
    date: string;
    type?: 'salary' | 'advance' | 'bonus';
    notes?: string;
};

function mapPaymentRow(p: PaymentRow): Payment {
    return {
        id: p.id,
        employeeId: p.employee_id,
        amount: p.amount,
        date: p.date,
        type: p.type || 'salary',
        notes: p.notes || ''
    };
}

function buildAttendanceUpdates(data: Partial<Attendance>): Record<string, unknown> {
    const updates: Record<string, unknown> = {};
    if (data.status) updates.status = data.status;
    if (data.role !== undefined) updates.role = data.role;
    if (data.site !== undefined) updates.site_id = data.site || null;
    if (data.startTime !== undefined) updates.start_time = data.startTime || null;
    if (data.endTime !== undefined) updates.end_time = data.endTime || null;
    if (data.workingHours !== undefined) updates.working_hours = data.workingHours;
    return updates;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
    const [pendingSyncCount, setPendingSyncCount] = useState(0);

    async function fetchData() {
        // Parallel Fetch for Performance
        const [
            { data: empData },
            { data: siteData },
            { data: attData },
            { data: payData }
        ] = await Promise.all([
            supabase.from('employees').select('*').order('created_at', { ascending: false }),
            supabase.from('sites').select('*').order('created_at', { ascending: false }),
            supabase.from('attendance').select('*').order('date', { ascending: false }),
            supabase.from('payments').select('*').order('date', { ascending: false })
        ]);

        if (empData) {
            setEmployees(empData.map(mapEmployeeRow));
        }

        if (siteData) {
            setSites(siteData.map(mapSiteRow));
        }

        if (attData) {
            setAttendance(attData.map(mapAttendanceRow));
        }

        if (payData) {
            setPayments(payData.map(mapPaymentRow));
        }
    }

    // Initial Data Fetch & Auth Subscription
    useEffect(() => {
        const handleAuthChange = async (session: Session | null) => {
            if (session?.user) {
                // Optimistically set user to unblock UI immediately
                const optimisticUser: User = {
                    id: session.user.id,
                    email: session.user.email!,
                    name: session.user.user_metadata?.full_name || 'User',
                    companyName: session.user.user_metadata?.company_name || 'My Company',
                };
                setUser(optimisticUser);

                // Parallel: Fetch Profile and Business Data
                const [profileRes] = await Promise.all([
                    supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
                    fetchData()
                ]);

                // Update with real profile data if different
                const profile = profileRes.data;
                if (profile) {
                    setUser(prev => ({
                        ...prev!,
                        name: profile.full_name || prev!.name,
                        companyName: profile.company_name || prev!.companyName
                    }));
                }
            } else {
                setUser(null);
                setEmployees([]);
                setAttendance([]);
                setPayments([]);
                setSites([]);
            }
            setIsLoading(false);
        };

        // 1. Listen for changes
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            handleAuthChange(session);
        });

        // 2. Explicit check on mount (fixes timeout issues if listener is slow)
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.warn("Session check failed, clearing auth:", error.message);
                supabase.auth.signOut();
                setIsLoading(false);
                return;
            }
            if (session) handleAuthChange(session);
            else setIsLoading(false); // Stop loading if no session found
        });

        // Safety Timeout: Force stop loading if Supabase hangs
        const safetyTimer = setTimeout(() => {
            setIsLoading(prev => {
                if (prev) {
                    console.warn('Supabase auth took too long. Forcing app load.');
                    return false;
                }
                return prev;
            });
        }, 5000);

        return () => {
            authListener.subscription.unsubscribe();
            clearTimeout(safetyTimer);
        };
    }, []);

    const addEmployee = async (data: Omit<Employee, 'id'>) => {
        if (!user) {
            console.error('Add Employee failed: No user logged in');
            alert('Error: You appear to be logged out. Please refresh the page.');
            return;
        }

        const previousEmployees = [...employees];

        // Optimistic Update
        const tempId = 'temp-' + Date.now();
        setEmployees(prev => [{
            id: tempId,
            name: data.name,
            role: data.role,
            dailyRate: data.dailyRate,
            joinedDate: data.joinedDate || new Date().toISOString(),
            active: data.active ?? true,
            phone: data.phone,
            nic: data.nic
        }, ...prev]);

        const { data: inserted, error } = await supabase.from('employees').insert({
            user_id: user.id,
            name: data.name,
            role: data.role,
            daily_rate: data.dailyRate,
            rate_history: data.rateHistory || [],
            additional_roles: data.additionalRoles || [],
            joined_date: data.joinedDate || new Date().toISOString(),
            status: data.active ? 'active' : 'inactive',
            phone: data.phone,
            nic: data.nic
        }).select().single();

        if (error || !inserted) {
            console.error('Error adding employee:', error);
            alert('Failed to add employee: ' + error?.message);
            setEmployees(previousEmployees); // Hard Rollback
        } else {
            setEmployees(prev => prev.map(emp => emp.id === tempId ? mapEmployeeRow(inserted) : emp));
        }
    };

    const updateEmployee = async (id: string, data: Partial<Employee>) => {
        if (!user) return;

        const previousEmployees = [...employees];

        // Optimistic Update
        setEmployees(prev => prev.map(emp =>
            emp.id === id ? { ...emp, ...data } : emp
        ));

        const updates: Record<string, unknown> = {};
        if (data.name) updates.name = data.name;
        if (data.role) updates.role = data.role;
        if (data.dailyRate) updates.daily_rate = data.dailyRate;
        if (data.rateHistory) updates.rate_history = data.rateHistory;
        if (data.additionalRoles) updates.additional_roles = data.additionalRoles;
        if (data.joinedDate) updates.joined_date = data.joinedDate;
        if (data.active !== undefined) updates.status = data.active ? 'active' : 'inactive';
        if (data.phone !== undefined) updates.phone = data.phone;
        if (data.nic !== undefined) updates.nic = data.nic;

        const { error } = await supabase.from('employees').update(updates).eq('id', id);

        if (error) {
            console.error('Update Employee Error:', error);
            alert('Failed to update employee: ' + error.message);
            setEmployees(previousEmployees);
        }
    };

    const deleteEmployee = async (id: string) => {
        if (!user) return;

        const previousEmployees = [...employees];
        const previousAttendance = [...attendance];
        const previousPayments = [...payments];

        // Optimistic Delete
        setEmployees(prev => prev.filter(e => e.id !== id));
        // Remove related local data
        setAttendance(prev => prev.filter(a => a.employeeId !== id));
        setPayments(prev => prev.filter(p => p.employeeId !== id));

        // 1. Delete Attendance
        const { error: attendanceError } = await supabase.from('attendance').delete().eq('employee_id', id);

        // 2. Delete Payments
        const { error: paymentsError } = await supabase.from('payments').delete().eq('employee_id', id);

        // 3. Delete Employee
        const { error: employeeError } = await supabase.from('employees').delete().eq('id', id);

        const error = attendanceError || paymentsError || employeeError;

        if (error) {
            console.error('Delete Employee Error:', error);
            alert('Failed to delete employee: ' + error.message);
            setEmployees(previousEmployees);
            setAttendance(previousAttendance);
            setPayments(previousPayments);
        }
    };




    const insertAttendanceSegment = async (record: Omit<Attendance, 'id'>) => {
        if (!user) return { data: null, error: null, status: 0 };

        const { data, error, status } = await supabase.from('attendance').insert({
            user_id: user.id,
            employee_id: record.employeeId,
            date: record.date,
            status: record.status,
            role: record.role,
            site_id: record.site || null,
            start_time: record.startTime || null,
            end_time: record.endTime || null,
            working_hours: record.workingHours
        }).select().single();

        return { data, error, status };
    };

    const insertPayment = async (data: Omit<Payment, 'id'>) => {
        if (!user) return { data: null, error: null, status: 0 };

        const { data: inserted, error, status } = await supabase.from('payments').insert({
            user_id: user.id,
            employee_id: data.employeeId,
            amount: data.amount,
            date: data.date,
            type: data.type || 'salary',
            notes: data.notes
        }).select().single();

        return { data: inserted, error, status };
    };

    const markAttendance = async (record: Omit<Attendance, 'id'>) => {
        if (!user) {
            alert('Error: You appear to be logged out.');
            return;
        }

        const previousAttendance = [...attendance];
        const tempId = 'temp-' + Math.random().toString(36).substr(2, 9);

        // Replace every segment for this employee/date with one quick action record.
        setAttendance(prev => {
            const others = prev.filter(a => !(a.employeeId === record.employeeId && a.date === record.date));
            return [...others, {
                id: tempId,
                employeeId: record.employeeId,
                date: record.date,
                createdAt: new Date().toISOString(),
                status: record.status,
                role: record.role,
                site: record.site,
                startTime: record.startTime,
                endTime: record.endTime,
                workingHours: record.workingHours
            }];
        });

        const { error: deleteError, status: deleteStatus } = await supabase
            .from('attendance')
            .delete()
            .eq('employee_id', record.employeeId)
            .eq('date', record.date);

        if (deleteError) {
            if (isNetworkFailure(deleteStatus)) {
                setPendingSyncCount(enqueue({ type: 'markAttendance', tempId, payload: record }).length);
                return;
            }
            console.error('Error marking attendance:', deleteError);
            alert('Failed to mark attendance: ' + deleteError.message);
            setAttendance(previousAttendance);
            return;
        }

        const { data: inserted, error: insertError, status: insertStatus } = await insertAttendanceSegment(record);

        if (insertError) {
            if (isNetworkFailure(insertStatus)) {
                setPendingSyncCount(enqueue({ type: 'markAttendance', tempId, payload: record }).length);
                return;
            }
            console.error('Error marking attendance:', insertError);
            alert('Failed to mark attendance: ' + insertError.message);
            setAttendance(previousAttendance);
            return;
        }

        if (inserted) {
            setAttendance(prev => prev.map(a => a.id === tempId ? mapAttendanceRow(inserted) : a));
        }
    };

    const addAttendanceSegment = async (record: Omit<Attendance, 'id'>) => {
        if (!user) return;

        const previousAttendance = [...attendance];
        const tempId = 'temp-' + Math.random().toString(36).substr(2, 9);

        setAttendance(prev => [
            ...prev.filter(a => !(a.employeeId === record.employeeId && a.date === record.date && a.status === 'absent')),
            {
                id: tempId,
                employeeId: record.employeeId,
                date: record.date,
                createdAt: new Date().toISOString(),
                status: record.status,
                role: record.role,
                site: record.site,
                startTime: record.startTime,
                endTime: record.endTime,
                workingHours: record.workingHours
            }
        ]);

        const { error: deleteError, status: deleteStatus } = await supabase
            .from('attendance')
            .delete()
            .eq('employee_id', record.employeeId)
            .eq('date', record.date)
            .eq('status', 'absent');

        if (deleteError && isNetworkFailure(deleteStatus)) {
            setPendingSyncCount(enqueue({ type: 'addAttendanceSegment', tempId, payload: record }).length);
            return;
        }

        const { data: inserted, error, status } = await insertAttendanceSegment(record);

        if (error) {
            if (isNetworkFailure(status)) {
                setPendingSyncCount(enqueue({ type: 'addAttendanceSegment', tempId, payload: record }).length);
                return;
            }
            console.error('Error adding attendance segment:', error);
            alert('Failed to add attendance segment: ' + error.message);
            setAttendance(previousAttendance);
        } else if (inserted) {
            setAttendance(prev => prev.map(a => a.id === tempId ? mapAttendanceRow(inserted) : a));
        }
    };

    const updateAttendanceSegment = async (id: string, data: Partial<Attendance>) => {
        if (!user) return;

        const previousAttendance = [...attendance];
        setAttendance(prev => prev.map(record => record.id === id ? { ...record, ...data } : record));

        const { error, status } = await supabase.from('attendance').update(buildAttendanceUpdates(data)).eq('id', id);

        if (error) {
            if (isNetworkFailure(status)) {
                setPendingSyncCount(enqueue({ type: 'updateAttendanceSegment', targetId: id, payload: data }).length);
                return;
            }
            console.error('Error updating attendance segment:', error);
            alert('Failed to update attendance segment: ' + error.message);
            setAttendance(previousAttendance);
        }
    };

    const deleteAttendanceSegment = async (id: string) => {
        if (!user) return;

        const previousAttendance = [...attendance];
        setAttendance(prev => prev.filter(record => record.id !== id));

        const { error, status } = await supabase.from('attendance').delete().eq('id', id);

        if (error) {
            if (isNetworkFailure(status)) {
                setPendingSyncCount(enqueue({ type: 'deleteAttendanceSegment', targetId: id }).length);
                return;
            }
            console.error('Error deleting attendance segment:', error);
            alert('Failed to delete attendance segment: ' + error.message);
            setAttendance(previousAttendance);
        }
    };

    const addPayment = async (data: Omit<Payment, 'id'>) => {
        if (!user) return;

        const previousPayments = [...payments];
        const tempId = 'temp-' + Date.now();

        // Optimistic
        setPayments(prev => [{
            id: tempId,
            employeeId: data.employeeId,
            amount: data.amount,
            date: data.date,
            type: data.type || 'salary',
            notes: data.notes || ''
        }, ...prev]);

        const { data: inserted, error, status } = await insertPayment(data);

        if (error || !inserted) {
            if (isNetworkFailure(status)) {
                setPendingSyncCount(enqueue({ type: 'addPayment', tempId, payload: data }).length);
                return;
            }
            console.error('Error adding payment:', error);
            alert('Failed to add payment: ' + error?.message);
            setPayments(previousPayments);
        } else {
            setPayments(prev => prev.map(p => p.id === tempId ? mapPaymentRow(inserted) : p));
        }
    };

    const updatePayment = async (id: string, data: Partial<Payment>) => {
        if (!user) return;

        const previousPayments = [...payments];

        // Optimistic Update
        setPayments(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));

        const updates: Record<string, unknown> = {};
        if (data.amount !== undefined) updates.amount = data.amount;
        if (data.date) updates.date = data.date;
        if (data.type) updates.type = data.type;
        if (data.notes !== undefined) updates.notes = data.notes;

        const { error } = await supabase.from('payments').update(updates).eq('id', id);

        if (error) {
            console.error('Update Payment Error:', error);
            alert('Failed to update payment: ' + error.message);
            setPayments(previousPayments);
        }
    };

    const deletePayment = async (id: string) => {
        if (!user) return;

        const previousPayments = [...payments];
        // Optimistic Update
        setPayments(prev => prev.filter(p => p.id !== id));

        const { error, status } = await supabase.from('payments').delete().eq('id', id);

        if (error) {
            if (isNetworkFailure(status)) {
                setPendingSyncCount(enqueue({ type: 'deletePayment', targetId: id }).length);
                return;
            }
            console.error('Delete Payment Error:', error);
            alert('Failed to delete payment: ' + error.message);
            setPayments(previousPayments);
        }
    };

    const syncQueue = async () => {
        if (!user) return;
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;

        let queue = loadQueue();

        for (const op of [...queue]) {
            if (op.type === 'markAttendance') {
                const { error: deleteError, status: deleteStatus } = await supabase
                    .from('attendance')
                    .delete()
                    .eq('employee_id', op.payload.employeeId)
                    .eq('date', op.payload.date);

                if (deleteError && isNetworkFailure(deleteStatus)) break;

                const { data: inserted, error, status } = deleteError
                    ? { data: null, error: deleteError, status: deleteStatus }
                    : await insertAttendanceSegment(op.payload);

                if (error) {
                    if (isNetworkFailure(status)) break;
                    queue = dequeue(op.id);
                    setPendingSyncCount(queue.length);
                    continue;
                }

                if (inserted) {
                    setAttendance(prev => prev.map(a => a.id === op.tempId ? mapAttendanceRow(inserted) : a));
                }
                queue = dequeue(op.id);
                setPendingSyncCount(queue.length);
            } else if (op.type === 'addAttendanceSegment') {
                await supabase
                    .from('attendance')
                    .delete()
                    .eq('employee_id', op.payload.employeeId)
                    .eq('date', op.payload.date)
                    .eq('status', 'absent');

                const { data: inserted, error, status } = await insertAttendanceSegment(op.payload);

                if (error) {
                    if (isNetworkFailure(status)) break;
                    queue = dequeue(op.id);
                    setPendingSyncCount(queue.length);
                    continue;
                }

                if (inserted) {
                    setAttendance(prev => prev.map(a => a.id === op.tempId ? mapAttendanceRow(inserted) : a));
                }
                queue = dequeue(op.id);
                setPendingSyncCount(queue.length);
            } else if (op.type === 'updateAttendanceSegment') {
                const { error, status } = await supabase.from('attendance').update(buildAttendanceUpdates(op.payload)).eq('id', op.targetId);

                if (error && isNetworkFailure(status)) break;

                queue = dequeue(op.id);
                setPendingSyncCount(queue.length);
            } else if (op.type === 'deleteAttendanceSegment') {
                const { error, status } = await supabase.from('attendance').delete().eq('id', op.targetId);

                if (error && isNetworkFailure(status)) break;

                queue = dequeue(op.id);
                setPendingSyncCount(queue.length);
            } else if (op.type === 'addPayment') {
                const { data: inserted, error, status } = await insertPayment(op.payload);

                if (error || !inserted) {
                    if (isNetworkFailure(status)) break;
                    queue = dequeue(op.id);
                    setPendingSyncCount(queue.length);
                    continue;
                }

                setPayments(prev => prev.map(p => p.id === op.tempId ? mapPaymentRow(inserted) : p));
                queue = dequeue(op.id);
                setPendingSyncCount(queue.length);
            } else if (op.type === 'deletePayment') {
                const { error, status } = await supabase.from('payments').delete().eq('id', op.targetId);

                if (error && isNetworkFailure(status)) break;

                queue = dequeue(op.id);
                setPendingSyncCount(queue.length);
            }
        }
    };

    // Offline queue: track connectivity and flush pending attendance/payment ops once back online.
    useEffect(() => {
        setPendingSyncCount(loadQueue().length);

        const handleOnline = () => {
            setIsOffline(false);
            syncQueue();
        };
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if (navigator.onLine) {
            syncQueue();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const addSite = async (data: Omit<Site, 'id'>) => {
        if (!user) return;

        const previousSites = [...sites];
        const tempId = 'temp-' + Date.now();

        // Optimistic
        setSites(prev => [{
            id: tempId,
            name: data.name,
            location: data.location,
            status: data.status || 'active'
        }, ...prev]);

        const { data: inserted, error } = await supabase.from('sites').insert({
            user_id: user.id,
            name: data.name,
            location: data.location,
            status: data.status || 'active'
        }).select().single();

        if (error || !inserted) {
            console.error('Error adding site:', error);
            alert('Failed to add site: ' + error?.message);
            setSites(previousSites);
        } else {
            setSites(prev => prev.map(s => s.id === tempId ? mapSiteRow(inserted) : s));
        }
    };

    const updateSite = async (id: string, data: Partial<Site>) => {
        if (!user) return;

        const previousSites = [...sites];

        // Optimistically Update
        setSites(prev => prev.map(site =>
            site.id === id ? { ...site, ...data } : site
        ));

        const updates: Record<string, unknown> = {};
        if (data.name) updates.name = data.name;
        if (data.location) updates.location = data.location;
        if (data.status) updates.status = data.status;

        const { error } = await supabase.from('sites').update(updates).eq('id', id);

        if (error) {
            console.error('Update Site Error:', error);
            alert('Failed to update site: ' + error.message);
            setSites(previousSites);
        }
    };

    const removeSite = async (id: string) => {
        if (!user) return;

        const previousSites = [...sites];
        setSites(prev => prev.filter(site => site.id !== id));

        const { error } = await supabase.from('sites').delete().eq('id', id);

        if (error) {
            console.error('Remove Site Error:', error);
            alert('Failed to remove site: ' + error.message);
            setSites(previousSites);
        }
    };

    const updateProfile = async (data: Pick<User, 'name' | 'companyName'>) => {
        if (!user) return;

        const trimmedName = data.name.trim();
        const trimmedCompanyName = data.companyName.trim();

        if (!trimmedName || !trimmedCompanyName) {
            throw new Error('Name and company name are required.');
        }

        const previousUser = user;
        const updatedUser = {
            ...user,
            name: trimmedName,
            companyName: trimmedCompanyName
        };

        setUser(updatedUser);

        const [{ error: profileError }, { error: metadataError }] = await Promise.all([
            supabase.from('profiles').upsert({
                id: user.id,
                email: user.email,
                full_name: trimmedName,
                company_name: trimmedCompanyName
            }),
            supabase.auth.updateUser({
                data: {
                    full_name: trimmedName,
                    company_name: trimmedCompanyName
                }
            })
        ]);

        const error = profileError || metadataError;

        if (error) {
            setUser(previousUser);
            throw new Error(error.message);
        }
    };

    const logout = async () => {
        // 1. Clear local state immediately
        setUser(null);
        setEmployees([]);
        setAttendance([]);
        setPayments([]);
        setSites([]);

        // 2. Clear Supabase session (fire and forget)
        supabase.auth.signOut().catch(err => console.error('SignOut Error:', err));

        // 3. Force redirect
        router.push('/login');
        router.refresh(); // Ensure server key clearing if using cookies
    };

    return (
        <AppContext.Provider value={{
            employees, attendance, payments, sites, user, isLoading, isOffline, pendingSyncCount,
            addEmployee, updateEmployee, deleteEmployee, markAttendance, addAttendanceSegment, updateAttendanceSegment, deleteAttendanceSegment, addPayment, updatePayment, deletePayment, addSite, updateSite, removeSite,
            updateProfile,
            logout
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
