export interface Employee {
    id: string;
    name: string;
    role: string;
    dailyRate: number;
    rateHistory?: { rate: number; effectiveDate: string }[];
    additionalRoles?: {
        role: string;
        dailyRate: number;
        rateHistory?: { rate: number; effectiveDate: string }[];
    }[];
    joinedDate: string;
    active: boolean;
    phone?: string;
    nic?: string;
    photoPath?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'half-day';

export interface Attendance {
    id: string;
    employeeId: string;
    date: string; // ISO YYYY-MM-DD
    createdAt?: string;
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
    status?: 'active' | 'completed' | 'on-hold';
    budget?: number;
}

export interface Payment {
    id: string;
    employeeId: string;
    amount: number;
    date: string;
    type?: 'salary' | 'advance' | 'bonus';
    notes?: string;
    receiptPath?: string;
}

// Free-form: 'materials' | 'equipment' | 'subcontractor' | 'other' are the built-in defaults
// (see DEFAULT_EXPENSE_CATEGORIES), but users can add their own custom category names too.
export type ExpenseCategory = string;

export const DEFAULT_EXPENSE_CATEGORIES = ['materials', 'equipment', 'subcontractor', 'other'] as const;

export function formatExpenseCategoryLabel(category: string): string {
    return category
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') || category;
}

export interface Expense {
    id: string;
    siteId: string;
    category: ExpenseCategory;
    description: string;
    amount: number;
    date: string;
    vendor?: string;
    notes?: string;
    receiptPath?: string;
}

export interface Material {
    id: string;
    siteId: string;
    name: string;
    unit: string;
    reorderPoint: number;
    notes?: string;
}

export type MaterialTransactionType = 'received' | 'used' | 'adjustment';

export interface MaterialTransaction {
    id: string;
    materialId: string;
    type: MaterialTransactionType;
    quantity: number; // signed: positive increases stock, negative decreases it
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
