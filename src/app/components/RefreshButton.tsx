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
                const { breakdown } = data;
                let msg = `Update complete. Added ${data.added} unique articles.\n`;
                if (breakdown) {
                    msg += `\nSources:\n- Particle: ${breakdown.particle}\n- Google News: ${breakdown.google} (Gen, Tech, Sci, AI)\n- Reddit: ${breakdown.reddit} (news, tech, sci, AI, GPT)`;
                }
                alert(msg);
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
                border: '1px solid var(--line)',
                background: 'transparent',
                color: 'var(--muted)',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
            }}
            onMouseOver={(e) => {
                if (!loading) {
                    e.currentTarget.style.color = 'var(--fg)';
                    e.currentTarget.style.borderColor = 'var(--muted)';
                }
            }}
            onMouseOut={(e) => {
                if (!loading) {
                    e.currentTarget.style.color = 'var(--muted)';
                    e.currentTarget.style.borderColor = 'var(--line)';
                }
            }}
        >
            {loading ? 'Refreshing...' : 'Refresh Feed'}
        </button>
    );
}
