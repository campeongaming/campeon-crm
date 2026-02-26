import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import path from 'path';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
    const imgPath = path.join(process.cwd(), 'public', 'bonuslab-icon.jpg');
    const imgData = readFileSync(imgPath);
    const base64 = `data:image/jpeg;base64,${imgData.toString('base64')}`;

    return new ImageResponse(
        (
            <div
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    overflow: 'hidden',
                    display: 'flex',
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={base64} width={32} height={32} alt="" />
            </div>
        ),
        { ...size }
    );
}
