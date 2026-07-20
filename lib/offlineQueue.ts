import { Attendance, Payment } from './types';

const STORAGE_KEY = 'fieldmetrik.offlineQueue.v1';

// Plain `Omit<Union, K>` collapses a discriminated union down to its shared keys instead of
// distributing over each member, so queue-entry input/output types are defined separately here.
export type QueueOpInput =
    | { type: 'markAttendance'; tempId: string; payload: Omit<Attendance, 'id'> }
    | { type: 'addAttendanceSegment'; tempId: string; payload: Omit<Attendance, 'id'> }
    | { type: 'updateAttendanceSegment'; targetId: string; payload: Partial<Attendance> }
    | { type: 'deleteAttendanceSegment'; targetId: string }
    | { type: 'addPayment'; tempId: string; payload: Omit<Payment, 'id'> }
    | { type: 'deletePayment'; targetId: string };

export type QueueOp =
    | ({ id: string; timestamp: number }) & Extract<QueueOpInput, { type: 'markAttendance' }>
    | ({ id: string; timestamp: number }) & Extract<QueueOpInput, { type: 'addAttendanceSegment' }>
    | ({ id: string; timestamp: number }) & Extract<QueueOpInput, { type: 'updateAttendanceSegment' }>
    | ({ id: string; timestamp: number }) & Extract<QueueOpInput, { type: 'deleteAttendanceSegment' }>
    | ({ id: string; timestamp: number }) & Extract<QueueOpInput, { type: 'addPayment' }>
    | ({ id: string; timestamp: number }) & Extract<QueueOpInput, { type: 'deletePayment' }>;

function generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'op-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function loadQueue(): QueueOp[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function saveQueue(queue: QueueOp[]): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function dequeue(id: string): QueueOp[] {
    const queue = loadQueue().filter(op => op.id !== id);
    saveQueue(queue);
    return queue;
}

export function enqueue(op: QueueOpInput): QueueOp[] {
    const queue = loadQueue();

    if (op.type === 'markAttendance') {
        const existingIndex = queue.findIndex(existing =>
            existing.type === 'markAttendance' &&
            existing.payload.employeeId === op.payload.employeeId &&
            existing.payload.date === op.payload.date
        );
        const entry: QueueOp = { ...op, id: generateId(), timestamp: Date.now() };
        if (existingIndex !== -1) {
            queue[existingIndex] = entry;
        } else {
            queue.push(entry);
        }
        saveQueue(queue);
        return queue;
    }

    if (op.type === 'updateAttendanceSegment' || op.type === 'deleteAttendanceSegment') {
        const pendingInsertIndex = queue.findIndex(existing =>
            (existing.type === 'addAttendanceSegment') && existing.tempId === op.targetId
        );
        if (pendingInsertIndex !== -1) {
            const pendingInsert = queue[pendingInsertIndex] as Extract<QueueOp, { type: 'addAttendanceSegment' }>;
            if (op.type === 'updateAttendanceSegment') {
                queue[pendingInsertIndex] = {
                    ...pendingInsert,
                    payload: { ...pendingInsert.payload, ...op.payload },
                };
            } else {
                queue.splice(pendingInsertIndex, 1);
            }
            saveQueue(queue);
            return queue;
        }
    }

    if (op.type === 'deletePayment') {
        const pendingInsertIndex = queue.findIndex(existing =>
            existing.type === 'addPayment' && existing.tempId === op.targetId
        );
        if (pendingInsertIndex !== -1) {
            queue.splice(pendingInsertIndex, 1);
            saveQueue(queue);
            return queue;
        }
    }

    const entry: QueueOp = { ...op, id: generateId(), timestamp: Date.now() } as QueueOp;
    queue.push(entry);
    saveQueue(queue);
    return queue;
}

export function isNetworkFailure(status: number | null | undefined): boolean {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
    return status === 0;
}
