'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Employee, Attendance, Payment, Site, User } from './types';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';

interface AppContextType {
    employees: Employee[];
    attendance: Attendance[];
    payments: Payment[];
    sites: Site[];
    user: User | null;
    isLoading: boolean;
    addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
    updateEmployee: (id: string, data: Partial<Employee>) => Promise<void>;
    deleteEmployee: (id: string) => Promise<void>;
    markAttendance: (record: Omit<Attendance, 'id'>) => Promise<void>;
    addPayment: (payment: Omit<Payment, 'id'>) => Promise<void>;
    updatePayment: (id: string, data: Partial<Payment>) => Promise<void>;
    deletePayment: (id: string) => Promise<void>;
    addSite: (site: Omit<Site, 'id'>) => Promise<void>;
    updateSite: (id: string, data: Partial<Site>) => Promise<void>;
    removeSite: (id: string) => Promise<void>;
    logout: () => void;
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

    // Initial Data Fetch & Auth Subscription
    useEffect(() => {
        const handleAuthChange = async (session: any) => {
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
                const [profileRes, _] = await Promise.all([
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

    const fetchData = async () => {
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
            setEmployees(empData.map(e => ({
                id: e.id,
                name: e.name,
                role: e.role,
                dailyRate: e.daily_rate,
                joinedDate: e.joined_date,
                active: e.status === 'active',
                phone: e.phone,
                nic: e.nic
            })));
        }

        if (siteData) {
            setSites(siteData.map(s => ({
                id: s.id,
                name: s.name,
                location: s.location,
                active: s.status === 'active'
            })));
        }

        if (attData) {
            setAttendance(attData.map(a => ({
                id: a.id,
                employeeId: a.employee_id,
                date: a.date,
                status: a.status,
                site: a.site_id,
                startTime: a.start_time,
                endTime: a.end_time,
                workingHours: a.working_hours
            })));
        }

        if (payData) {
            setPayments(payData.map(p => ({
                id: p.id,
                employeeId: p.employee_id,
                amount: p.amount,
                date: p.date,
                notes: p.notes || ''
            })));
        }
    };

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

        const { error } = await supabase.from('employees').insert({
            user_id: user.id,
            name: data.name,
            role: data.role,
            daily_rate: data.dailyRate,
            joined_date: data.joinedDate || new Date().toISOString(),
            status: data.active ? 'active' : 'inactive',
            phone: data.phone,
            nic: data.nic
        });

        if (error) {
            console.error('Error adding employee:', error);
            alert('Failed to add employee: ' + error.message);
            setEmployees(previousEmployees); // Hard Rollback
        } else {
            fetchData();
        }
    };

    const updateEmployee = async (id: string, data: Partial<Employee>) => {
        if (!user) return;

        // Optimistic Update
        setEmployees(prev => prev.map(emp =>
            emp.id === id ? { ...emp, ...data } : emp
        ));

        const updates: any = {};
        if (data.name) updates.name = data.name;
        if (data.role) updates.role = data.role;
        if (data.dailyRate) updates.daily_rate = data.dailyRate;
        if (data.joinedDate) updates.joined_date = data.joinedDate;
        if (data.active !== undefined) updates.status = data.active ? 'active' : 'inactive';
        if (data.phone !== undefined) updates.phone = data.phone;
        if (data.nic !== undefined) updates.nic = data.nic;

        const { error } = await supabase.from('employees').update(updates).eq('id', id);

        if (error) {
            console.error('Update Employee Error:', error);
            alert('Failed to update employee: ' + error.message);
            fetchData();
        }
    };

    const deleteEmployee = async (id: string) => {
        if (!user) return;

        // Optimistic Delete
        setEmployees(prev => prev.filter(e => e.id !== id));
        // Remove related local data
        setAttendance(prev => prev.filter(a => a.employeeId !== id));
        setPayments(prev => prev.filter(p => p.employeeId !== id));

        // 1. Delete Attendance
        await supabase.from('attendance').delete().eq('employee_id', id);

        // 2. Delete Payments
        await supabase.from('payments').delete().eq('employee_id', id);

        // 3. Delete Employee
        const { error } = await supabase.from('employees').delete().eq('id', id);

        if (error) {
            console.error('Delete Employee Error:', error);
            alert('Failed to delete employee: ' + error.message);
            fetchData();
        }
    };




    const markAttendance = async (data: Omit<Attendance, 'id'>) => {
        if (!user) {
            alert('Error: You appear to be logged out.');
            return;
        }

        // Optimistic Update: Update UI immediately
        setAttendance(prev => {
            const others = prev.filter(a => !(a.employeeId === data.employeeId && a.date === data.date));
            return [...others, {
                id: 'temp-' + Math.random().toString(36).substr(2, 9), // Unique Temporary ID
                employeeId: data.employeeId,
                date: data.date,
                status: data.status,
                site: data.site,
                startTime: data.startTime,
                endTime: data.endTime,
                workingHours: data.workingHours
            }];
        });

        // Upsert based on employee_id and date
        const { error } = await supabase.from('attendance').upsert({
            user_id: user.id,
            employee_id: data.employeeId,
            date: data.date,
            status: data.status,
            site_id: data.site, // Ensure this is a UUID!
            start_time: data.startTime,
            end_time: data.endTime,
            working_hours: data.workingHours
        }, { onConflict: 'employee_id,date' });

        if (error) {
            console.error('Error marking attendance:', error);
            alert('Failed to mark attendance: ' + error.message);
            // Revert state by fetching authentic data
            fetchData();
        } else {
            // Silently sync in background to confirm (optional, but good for consistency)
            fetchData();
        }
    };

    const addPayment = async (data: Omit<Payment, 'id'>) => {
        if (!user) return;

        // Optimistic
        setPayments(prev => [{
            id: 'temp-' + Date.now(),
            employeeId: data.employeeId,
            amount: data.amount,
            date: data.date,
            notes: data.notes || ''
        }, ...prev]);

        const { error } = await supabase.from('payments').insert({
            user_id: user.id,
            employee_id: data.employeeId,
            amount: data.amount,
            date: data.date,
            type: 'salary', // Default for now
            notes: data.notes
        });

        if (!error) fetchData();
        else fetchData(); // Revert
    };

    const updatePayment = async (id: string, data: Partial<Payment>) => {
        if (!user) return;

        // Optimistic Update
        setPayments(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));

        const updates: any = {};
        if (data.amount !== undefined) updates.amount = data.amount;
        if (data.date) updates.date = data.date;
        if (data.notes !== undefined) updates.notes = data.notes;

        const { error } = await supabase.from('payments').update(updates).eq('id', id);

        if (error) {
            console.error('Update Payment Error:', error);
            alert('Failed to update payment: ' + error.message);
            fetchData(); // Revert
        }
    };

    const deletePayment = async (id: string) => {
        if (!user) return;
        // Optimistic Update
        setPayments(prev => prev.filter(p => p.id !== id));

        const { error } = await supabase.from('payments').delete().eq('id', id);

        if (error) {
            console.error('Delete Payment Error:', error);
            alert('Failed to delete payment: ' + error.message);
            fetchData(); // Revert
        }
    };

    const addSite = async (data: Omit<Site, 'id'>) => {
        if (!user) return;

        // Optimistic
        setSites(prev => [{
            id: 'temp-' + Date.now(),
            name: data.name,
            location: data.location,
            active: data.active ?? true
        }, ...prev]);

        const { error } = await supabase.from('sites').insert({
            user_id: user.id,
            name: data.name,
            location: data.location,
            status: data.active ? 'active' : 'on-hold'
        });

        if (!error) fetchData();
        else fetchData();
    };

    const updateSite = async (id: string, data: Partial<Site>) => {
        if (!user) return;

        // Optimistically Update
        setSites(prev => prev.map(site =>
            site.id === id ? { ...site, ...data } : site
        ));

        const updates: any = {};
        if (data.name) updates.name = data.name;
        if (data.location) updates.location = data.location;
        if (data.active !== undefined) updates.status = data.active ? 'active' : 'on-hold';

        const { error } = await supabase.from('sites').update(updates).eq('id', id);

        if (error) {
            console.error('Update Site Error:', error);
            alert('Failed to update site: ' + error.message);
            fetchData();
        }
    };

    const removeSite = async (id: string) => {
        const { error } = await supabase.from('sites').delete().eq('id', id);
        if (!error) fetchData();
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
            employees, attendance, payments, sites, user, isLoading,
            addEmployee, updateEmployee, deleteEmployee, markAttendance, addPayment, updatePayment, deletePayment, addSite, updateSite, removeSite,
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
