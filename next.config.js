/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/auth/role-select',
        destination: '/onboarding',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
