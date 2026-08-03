// VedicHora build trigger
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverComponentsExternalPackages: ['playwright-core', '@sparticuz/chromium'] },
  typescript: { ignoreBuildErrors: true, tsconfigPath: "./tsconfig.json" },
  reactStrictMode: true,
  experimental: { serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium'] },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
