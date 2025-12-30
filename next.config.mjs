/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    // Ensure html5-qrcode is properly externalized
    config.externals = config.externals || [];
    return config;
  },
  // Disable static optimization for pages that use dynamic imports
  experimental: {
    esmExternals: 'loose',
  },
};

export default nextConfig;


