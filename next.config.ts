import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PWA configuration (will be enhanced by next-pwa)
  experimental: {
    // Enable PWA features
    ppr: true,
  },

  // Disable strict mode for development with certain libraries
  reactStrictMode: true,

  // Images configuration
  images: {
    domains: ['localhost'],
    // Allow images from storage providers
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
    ],
  },

  // Output standalone for Docker optimization
  output: 'standalone',

  // Webpack configuration for Puppeteer
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Fix for Puppeteer in Docker
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
    }

    return config;
  },
};

export default nextConfig;