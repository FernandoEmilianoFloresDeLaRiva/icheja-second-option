import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "logo.svg"],
      manifest: {
        // ... tu manifiesto sigue igual
        name: "Mi App con Vite",
        short_name: "MiApp",
        description:
          "Aplicación que ayuda a las personas en su proceso de alfabetización.",
        theme_color: "#C90166",
        icons: [
          {
            src: "pwa0.png", //Cambiar de icono
            sizes: "144x144",
            type: "image/png",
          },
          {
            src: "pwa1.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa2.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            // Estrategia para los assets principales (JS, CSS)
            urlPattern: ({ request }) =>
              ["script", "style", "worker"].includes(request.destination),
            handler: "StaleWhileRevalidate", // <-- CAMBIO AQUÍ
            options: {
              cacheName: "assets-cache",
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Días
              },
            },
          },
          {
            // Estrategia para las imágenes
            urlPattern: ({ request }) => request.destination === "image",
            handler: "StaleWhileRevalidate", // <-- CAMBIO AQUÍ
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Días
              },
            },
          },
          {
            urlPattern: /\/stub_images\/.*/,
            handler: "StaleWhileRevalidate",
            options: {
              // Nombre del caché específico para estas imágenes
              cacheName: "images-cache-exercises",
              expiration: {
                maxEntries: 100, // Guarda hasta 100 imágenes
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Días
              },

              // Importante para manejar respuestas de diferentes orígenes (CDNs)
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
});
