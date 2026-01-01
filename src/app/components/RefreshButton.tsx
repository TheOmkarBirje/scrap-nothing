'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RefreshButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/update');
            const data = await res.json();

            if (!res.ok) {
                alert(`Update failed: ${data.error || res.statusText}`);
            } else {
                alert(`Update complete. Added ${data.added} new articles.`);
                router.refresh();
            }
        } catch (error) {
            console.error('Failed to refresh feed:', error);
            alert('Failed to contact server.');
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
