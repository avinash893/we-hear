/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  headers: async () => {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=(), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://challenges.cloudflare.com; connect-src 'self' ws: wss: https://api.razorpay.com https://lumberjack.razorpay.com https://challenges.cloudflare.com; frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://challenges.cloudflare.com; img-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; media-src 'self' blob:; worker-src 'self' blob:;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
