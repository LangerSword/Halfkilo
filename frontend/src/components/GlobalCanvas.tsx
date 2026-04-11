"use client";

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const DynamicGameCanvas = dynamic(
    () => import('./GameCanvas'),
    { ssr: false }
);

export default function GlobalCanvas() {
    const pathname = usePathname();

    // Show lobby world on home + battle pages
    const showGame = pathname === '/' || pathname === '/battle' || pathname?.startsWith('/battle/');

    if (!showGame) {
        return null;
    }

    return (
        <div style={{
            position: "fixed", top: 56, left: 0, right: 0, bottom: 48,
            zIndex: 1, overflow: "hidden",
        }}>
            <DynamicGameCanvas />
        </div>
    );
}
