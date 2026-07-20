'use client';

import { useEffect, useState } from 'react';
import { AttachmentBucket, getAttachmentSignedUrl } from '@/lib/storage';

export function AttachmentImage({
    bucket,
    path,
    alt,
    className,
    fallback,
}: {
    bucket: AttachmentBucket;
    path: string | undefined;
    alt: string;
    className?: string;
    fallback: React.ReactNode;
}) {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const signedUrl = path ? await getAttachmentSignedUrl(bucket, path) : null;
            if (!cancelled) setUrl(signedUrl);
        })();

        return () => {
            cancelled = true;
        };
    }, [bucket, path]);

    if (!path || !url) return <>{fallback}</>;

    // Signed URLs are per-user, dynamically generated, and short-lived — not worth
    // configuring next/image remote patterns for.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt} className={className} />;
}
