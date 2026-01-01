'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RefreshButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRefresh = async () => {
        setLoading(true);
        try {
            await fetch('/api/update');
            router.refresh();
            // Force a hard reload if router.refresh() isn't enough to clear server cache logic locally
            // window.location.reload(); 
        } catch (error) {
            console.error('Failed to refresh feed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                border: '1px solid var(--card-border)',
                background: 'var(--card-bg)',
                color: 'var(--foreground)',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                marginTop: '1rem'
            }}
        >
            {loading ? 'Refreshing...' : 'Refresh Feed'}
        </button>
    );
}
