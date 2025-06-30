import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
      {
        hostname: 'media.licdn.com',
      },
      {
        hostname: 'platform-lookaside.fbsbx.com',
      },
    ],
  },
};

export default nextConfig;
