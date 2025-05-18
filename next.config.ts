import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isProd ? '/rpc-shield-front' : '',
  assetPrefix: isProd ? '/rpc-shield-front/' : '',
};

export default nextConfig;
