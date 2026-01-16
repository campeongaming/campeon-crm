'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to admin page
        router.push('/admin');
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
            <div className="text-white text-xl">Loading...</div>
        </div>
    );
}
