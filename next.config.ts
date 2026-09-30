import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Fully client-side app: export plain static files (folder "out") that any host can serve.
  output: "export",
  // /renamer/ -> renamer/index.html, so links work on hosts without special URL rewriting.
  trailingSlash: true,
};

export default nextConfig;
