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
    markAttendance: (record: Omit<Attendance, 'id'>) => Promise<void>;
    addPayment: (payment: Omit<Payment, 'id'>) => Promise<void>;
    addSite: (site: Omit<Site, 'id'>) => Promise<void>;
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
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                // Fetch Profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();

                const currentUser: User = {
                    id: session.user.id,
                    email: session.user.email!,
                    name: profile?.full_name || session.user.user_metadata?.full_name || 'User',
                    companyName: profile?.company_name || session.user.user_metadata?.company_name || 'My Company',
                };
                setUser(currentUser);
                await fetchData();
            } else {
                setUser(null);
                setEmployees([]);
                setAttendance([]);
                setPayments([]);
                setSites([]);
            }
            setIsLoading(false);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const fetchData = async () => {
        // Fetch Employees
        const { data: empData } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
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

        // Fetch Sites
        const { data: siteData } = await supabase.from('sites').select('*').order('created_at', { ascending: false });
        if (siteData) {
            setSites(siteData.map(s => ({
                id: s.id,
                name: s.name,
                location: s.location,
                active: s.status === 'active'
            })));
        }

        // Fetch Attendance
        const { data: attData } = await supabase.from('attendance').select('*').order('date', { ascending: false });
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

        // Fetch Payments
        const { data: payData } = await supabase.from('payments').select('*').order('date', { ascending: false });
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
        // Optimistic Update
        setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));

        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.role) updateData.role = data.role;
        if (data.dailyRate) updateData.daily_rate = data.dailyRate;
        if (data.active !== undefined) updateData.status = data.active ? 'active' : 'inactive';

        const { error } = await supabase.from('employees').update(updateData).eq('id', id);
        if (!error) fetchData();
        else {
            alert('Failed to update employee');
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

    const removeSite = async (id: string) => {
        const { error } = await supabase.from('sites').delete().eq('id', id);
        if (!error) fetchData();
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
        // Force cleanup even if auth listener delays or fails
        setUser(null);
        setEmployees([]);
        router.push('/login');
    };

    return (
        <AppContext.Provider value={{
            employees, attendance, payments, sites, user, isLoading,
            addEmployee, updateEmployee, markAttendance, addPayment, addSite, removeSite,
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
