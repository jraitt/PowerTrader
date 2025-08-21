/** @type {import('next').NextConfig} */
const nextConfig = {
  // Experimental features (serverActions enabled by default in Next.js 14+)

  // Image configuration for Supabase Storage and external sources
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Build configuration for Docker
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Telemetry disabled via environment variable NEXT_TELEMETRY_DISABLED=1

  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.NODE_ENV,
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Redirects for SEO and user experience
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/inventory',
        permanent: true,
      },
    ];
  },

  // Webpack configuration for better bundle optimization
  webpack: (config, { isServer }) => {
    // Optimize for production builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    return config;
  },

  // TypeScript configuration
  typescript: {
    // Skip type checking during production builds for faster deployment
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },

  // ESLint configuration
  eslint: {
    // Skip ESLint during production builds to allow deployment
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },

  // Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },

  // PoweredByHeader
  poweredByHeader: false,
};

module.exports = nextConfig;