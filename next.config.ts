import type { NextConfig } from "next";
// @ts-ignore
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  // Prevent server-only packages from being bundled for the browser
  // (puppeteer, bullmq, ioredis, sharp, etc. use Node.js built-ins not available in browsers)
  serverExternalPackages: [
    'puppeteer',
    'puppeteer-core',
    '@puppeteer/browsers',
    'bullmq',
    'ioredis',
    'sharp',
    '@prisma/client',
    '@aws-sdk/client-s3',
    '@aws-sdk/s3-request-presigner',
    '@google/generative-ai',
    '@anthropic-ai/sdk',
    'openai',
    'qrcode',
    'jsonwebtoken',
  ],

  // PWA configuration (will be enhanced by next-pwa)
  experimental: {
    // Disable PPR since we are using stable Next.js 15
    ppr: false,
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

export default withPWA(nextConfig);