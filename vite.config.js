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
  },
});
