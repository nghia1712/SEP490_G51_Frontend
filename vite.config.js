import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Port for the development server
    host: 'localhost', // Chỉ hiển thị localhost
    open: false, // Không tự mở trình duyệt
    strictPort: true, // Không tự đổi cổng (tránh mở lại tab khác)
    proxy: {
      // Proxy all /api calls to the ASP.NET backend (HTTPS, dev cert)
      '/api': {
        target: 'http://localhost:5137',
        changeOrigin: true,
        secure: false,
        // Keep the /api prefix because backend controllers are under /api
        // If your backend path changes, update rewrite accordingly
        // rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
});
