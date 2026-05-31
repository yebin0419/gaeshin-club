import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 0,  // 동적 라우트 클라이언트 캐시 즉시 만료
      static: 180,
    },
  },
};

export default nextConfig;
