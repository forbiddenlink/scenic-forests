import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                cabins: resolve(__dirname, 'cabins.html'),
                faq: resolve(__dirname, 'faq.html'),
                reservations: resolve(__dirname, 'reservations.html'),
            },
        },
    },
});
