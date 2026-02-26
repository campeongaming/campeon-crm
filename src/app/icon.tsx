import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
    const imgData = readFileSync(join(process.cwd(), 'public', 'favicon-logo.png'));
    const base64 = `data:image/png;base64,${imgData.toString('base64')}`;

    return new ImageResponse(
        (
            <div
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    overflow: 'hidden',
                    display: 'flex',
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={base64} width={32} height={32} alt="" style={{ borderRadius: 8 }} />
            </div>
        ),
        { ...size }
    );
}
