export interface Employee {
    id: string;
    name: string;
    role: string;
    dailyRate: number;
    joinedDate: string;
    active: boolean;
}

export type AttendanceStatus = 'present' | 'absent' | 'half-day';

export interface Attendance {
    id: string;
    employeeId: string;
    date: string; // ISO YYYY-MM-DD
    status: AttendanceStatus;
    site?: string;
}

export interface Site {
    id: string;
    name: string;
    location: string;
    active: boolean;
}

export interface Payment {
    id: string;
    employeeId: string;
    amount: number;
    date: string;
    notes?: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string;
    companyName: string;
}
