import { supabase } from './supabase';

export type AttachmentBucket = 'employee-photos' | 'payment-receipts' | 'expense-receipts';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<AttachmentBucket, string[]> = {
    'employee-photos': ['image/jpeg', 'image/png', 'image/webp'],
    'payment-receipts': ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    'expense-receipts': ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

export function validateAttachmentFile(bucket: AttachmentBucket, file: File): string | null {
    if (!ALLOWED_TYPES[bucket].includes(file.type)) {
        return `Unsupported file type. Allowed: ${ALLOWED_TYPES[bucket].join(', ')}`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
        return 'File is too large. Maximum size is 5MB.';
    }
    return null;
}

export async function uploadAttachment(bucket: AttachmentBucket, userId: string, file: File): Promise<string> {
    const error = validateAttachmentFile(bucket, file);
    if (error) throw new Error(error);

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: true,
        cacheControl: '3600',
    });

    if (uploadError) throw uploadError;
    return path;
}

export async function getAttachmentSignedUrl(bucket: AttachmentBucket, path: string, expiresIn = 3600): Promise<string | null> {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error || !data) return null;
    return data.signedUrl;
}

export async function removeAttachment(bucket: AttachmentBucket, path: string): Promise<void> {
    await supabase.storage.from(bucket).remove([path]);
}
