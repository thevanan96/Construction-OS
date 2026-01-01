export interface Employee {
    id: string;
    name: string;
    role: string;
    dailyRate: number;
    additionalRoles?: { role: string; dailyRate: number }[];
    joinedDate: string;
    active: boolean;
    phone?: string;
    nic?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'half-day';

export interface Attendance {
    id: string;
    employeeId: string;
    date: string; // ISO YYYY-MM-DD
    status: AttendanceStatus;
    role?: string; // The role performed on this specific day
    site?: string;
    startTime?: string;
    endTime?: string;
    workingHours?: number;
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
