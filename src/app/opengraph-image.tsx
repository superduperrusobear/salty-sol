import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Salty Sol';
export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'black',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src="images/s.png"
          alt="Salty Sol"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
} 