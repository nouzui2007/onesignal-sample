/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // OneSignal SDK tries to fetch OneSignalSDK.sw.js from the site root - proxy to CDN
      {
        source: '/OneSignalSDK.sw.js',
        destination: 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js',
      },
    ]
  },
}

module.exports = nextConfig
