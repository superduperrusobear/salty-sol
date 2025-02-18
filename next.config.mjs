/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'saltysol-81f2a.firebaseapp.com', 'saltysol-81f2a.firebasestorage.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    turbo: true,
  },
};

export default nextConfig; 