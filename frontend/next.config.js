/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ijaac/shared", "@ijaac/aws", "@ijaac/data-store", "@ijaac/email"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "randomuser.me" },
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
      { protocol: "https", hostname: "*.amazonaws.com" },
    ],
  },
};

module.exports = nextConfig;
