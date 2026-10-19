import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// Apple HIG React + Vite Configuration supporting both Laravel and standalone Vercel SPA
export default defineConfig(() => {
    const isStandaloneSpa = process.env.VERCEL === '1' || process.env.STANDALONE_SPA === 'true';

    return {
        plugins: [
            ...(isStandaloneSpa
                ? []
                : [
                      laravel({
                          input: ['resources/css/app.css', 'resources/js/main.jsx'],
                          refresh: true,
                      }),
                  ]),
            react(),
            tailwindcss(),
        ],
        resolve: {
            alias: {
                '@': path.resolve(import.meta.dirname || '.', 'resources/js'),
            },
        },
        server: {
            watch: {
                ignored: ['**/storage/framework/views/**'],
            },
        },
    };
});
