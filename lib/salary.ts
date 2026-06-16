import { Attendance, AttendanceStatus, Employee } from './types';

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

export function getAttendanceHours(record: Attendance) {
    if (record.workingHours !== undefined && record.workingHours !== null) return record.workingHours;
    if (record.status === 'present') return STANDARD_DAILY_HOURS;
    if (record.status === 'half-day') return HALF_DAY_HOURS;
    return 0;
}

export function getAttendanceDayKey(record: Pick<Attendance, 'employeeId' | 'date'>) {
    return `${record.employeeId}-${record.date}`;
}

export function groupAttendanceByEmployeeDate(records: Attendance[]) {
    return records.reduce<Record<string, Attendance[]>>((groups, record) => {
        const key = getAttendanceDayKey(record);
        groups[key] = [...(groups[key] || []), record];
        return groups;
    }, {});
}

function groupAttendanceByRole(employee: Employee, records: Attendance[]) {
    return records.reduce<Record<string, Attendance[]>>((groups, record) => {
        const role = record.role || employee.role;
        groups[role] = [...(groups[role] || []), record];
        return groups;
    }, {});
}

function calculateRoleGroupEarnings(employee: Employee, records: Attendance[]) {
    const workedRecords = records.filter(record => record.status !== 'absent' && getAttendanceHours(record) > 0);
    if (workedRecords.length === 0) return { earnings: 0, hours: 0 };

    const totalHours = workedRecords.reduce((sum, record) => sum + getAttendanceHours(record), 0);
    const firstRecord = workedRecords[0];
    const role = firstRecord.role || employee.role;
    const rate = getApplicableDailyRate(employee, role, firstRecord.date);
    const isHalfDay = totalHours === HALF_DAY_HOURS && workedRecords.every(record => record.status === 'half-day');

    return {
        earnings: calculateDailyEarnings(rate, totalHours, isHalfDay ? 'half-day' : 'present'),
        hours: totalHours,
    };
}

export function calculateAttendanceDayEarnings(employee: Employee, records: Attendance[]) {
    const workedRecords = records.filter(record => record.status !== 'absent' && getAttendanceHours(record) > 0);
    if (workedRecords.length === 0) return { earnings: 0, hours: 0 };

    const roleGroups = Object.values(groupAttendanceByRole(employee, workedRecords));

    return {
        earnings: roleGroups.reduce((sum, roleRecords) => sum + calculateRoleGroupEarnings(employee, roleRecords).earnings, 0),
        hours: workedRecords.reduce((sum, record) => sum + getAttendanceHours(record), 0),
    };
}

export function calculateAttendanceRecordsEarnings(employee: Employee, records: Attendance[]) {
    return Object.values(groupAttendanceByEmployeeDate(records)).reduce((total, dayRecords) => {
        return total + calculateAttendanceDayEarnings(employee, dayRecords).earnings;
    }, 0);
}

export function calculateAttendanceSegmentCosts(employee: Employee, records: Attendance[]) {
    return Object.values(groupAttendanceByEmployeeDate(records)).flatMap((dayRecords) => {
        const roleGroups = Object.values(groupAttendanceByRole(employee, dayRecords));

        return roleGroups.flatMap((roleRecords) => {
            const role = calculateRoleGroupEarnings(employee, roleRecords);
            const roleHours = roleRecords.reduce((sum, record) => sum + getAttendanceHours(record), 0);

            return roleRecords.map((record) => {
                const hours = getAttendanceHours(record);
                const share = roleHours > 0 && record.status !== 'absent' ? hours / roleHours : 0;

                return {
                    record,
                    hours,
                    cost: role.earnings * share,
                };
            });
        });
    });
}
