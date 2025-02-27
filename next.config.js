/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  webpack: (config, { isServer }) => {
    // Add support for Phaser in webpack
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules\/phaser/,
      type: 'javascript/auto'
    });

    // Prevent Phaser from being included in the server bundle
    if (isServer) {
      config.externals = [...config.externals, 'phaser'];
    }

    return config;
  },
  // Add custom headers for WebSocket support
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  // Optimize production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  typescript: {
    ignoreBuildErrors: true // Temporarily ignore TypeScript errors during build
  }
}

module.exports = nextConfig; 