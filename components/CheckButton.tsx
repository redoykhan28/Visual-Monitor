'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckButton({ pageId, url }: { pageId: number, url: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCheck = async () => {
    setLoading(true);
    // Call our API route
    await fetch('/api/check', {
        method: 'POST',
        body: JSON.stringify({ pageId, url })
    });
    setLoading(false);
    router.refresh(); // Refresh the page to show new results
  };

  return (
    <button 
        onClick={handleCheck} 
        disabled={loading}
        className="bg-gray-900 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
    >
        {loading ? 'Scanning...' : 'Run Check'}
    </button>
  );
}