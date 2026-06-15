import { AttendanceStatus, Employee } from './types';

const STANDARD_DAILY_HOURS = 10.5;
const OVERTIME_RATE_HOURS = 10;
const HALF_DAY_HOURS = 5;
type RateHistory = { rate: number; effectiveDate: string }[];

export function getRateForDate(baseRate: number, history: RateHistory | undefined, date: string) {
    if (!history || history.length === 0) return baseRate;

    const sorted = [...history].sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
    const targetDate = new Date(date);
    const applicableEntry = sorted.find(h => new Date(h.effectiveDate) <= targetDate);

    return applicableEntry ? applicableEntry.rate : baseRate;
}

export function getApplicableDailyRate(employee: Employee, role: string | undefined, date: string) {
    const recordRole = role || employee.role;
    let applicableRate = employee.dailyRate;
    let rateHistory = employee.rateHistory;

    if (recordRole !== employee.role) {
        const roleData = employee.additionalRoles?.find((r) => r.role === recordRole);
        if (roleData) {
            applicableRate = roleData.dailyRate;
            rateHistory = roleData.rateHistory;
        }
    }

    return getRateForDate(applicableRate, rateHistory, date);
}

export function calculateDailyEarnings(
    dailyRate: number,
    workingHours: number | undefined | null,
    status?: AttendanceStatus
) {
    if (workingHours !== undefined && workingHours !== null) {
        if (workingHours <= 0 || status === 'absent') return 0;
        if (status === 'half-day' && workingHours === HALF_DAY_HOURS) return dailyRate / 2;

        const earnings = dailyRate + (dailyRate / OVERTIME_RATE_HOURS) * (workingHours - STANDARD_DAILY_HOURS);

        return Math.max(0, earnings);
    }

    if (status === 'present') return dailyRate;
    if (status === 'half-day') return dailyRate / 2;

    return 0;
}
