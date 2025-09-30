import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { copyFileSync, existsSync, readFileSync } from "fs";

// Plugin to copy PDF.js worker to public directory
const copyPdfWorker = () => {
  return {
    name: 'copy-pdf-worker',
    buildStart() {
      const workerSrc = path.resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
      const workerDest = path.resolve(__dirname, 'public/pdf.worker.min.mjs');

      if (existsSync(workerSrc)) {
        copyFileSync(workerSrc, workerDest);
        console.log('✓ Copied PDF.js worker to public directory');
      }
    },
    configureServer(server: any) {
      server.middlewares.use('/pdf.worker.min.mjs', (req: any, res: any, next: any) => {
        const workerPath = path.resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
        if (existsSync(workerPath)) {
          res.setHeader('Content-Type', 'application/javascript');
          res.setHeader('Access-Control-Allow-Origin', '*');
          const fileContent = readFileSync(workerPath);
          res.end(fileContent);
        } else {
          next();
        }
      });
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    copyPdfWorker(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdfjs': ['pdfjs-dist'],
        },
      },
    },
  },
  worker: {
    format: 'es',
  },
}));