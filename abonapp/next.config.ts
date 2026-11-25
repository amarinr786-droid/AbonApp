import type { NextConfig } from "next";

// Exportación estática: `npm run build` genera la carpeta `out/`, lista para subir a S3.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true, // /login/ -> login/index.html (necesario para S3)
  images: { unoptimized: true },
  devIndicators: false, // oculta el indicador "N" de Next.js en modo desarrollo
  experimental: {
    agentFeedback: true,
  },
  turbopack: {
    // Procesa Tailwind CSS 4 en los archivos .css (sin esto la app queda sin estilos).
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;