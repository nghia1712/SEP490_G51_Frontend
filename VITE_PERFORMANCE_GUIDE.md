# 🚀 Hướng dẫn tối ưu Vite để giảm Ping và Lag

## ⚡ Các tối ưu đã áp dụng

### 1. **Dev Server Optimization**
```javascript
server: {
  host: true,           // Cho phép truy cập từ network
  hmr: {
    overlay: false,     // Tắt overlay lỗi để giảm lag
  },
  watch: {
    usePolling: false,  // Tắt polling để giảm CPU usage
    ignored: ['**/node_modules/**', '**/.git/**'],
  },
  preTransformRequests: true, // Pre-transform để tăng tốc
}
```

### 2. **Build Optimization**
```javascript
build: {
  target: 'esnext',     // Sử dụng ES modules hiện đại
  minify: 'esbuild',    // esbuild nhanh hơn terser
  sourcemap: false,     // Tắt sourcemap trong dev
  rollupOptions: {
    output: {
      manualChunks: {   // Chia code thành chunks
        vendor: ['react', 'react-dom'],
        mui: ['@mui/material', '@mui/icons-material'],
      },
    },
  },
}
```

### 3. **Dependencies Optimization**
```javascript
optimizeDeps: {
  include: [            // Pre-bundle các dependencies quan trọng
    'react',
    'react-dom',
    '@mui/material',
    '@mui/icons-material',
    'react-router-dom',
  ],
  exclude: ['@vite/client', '@vite/env'],
}
```

## 🔧 Các tối ưu bổ sung

### 1. **Tối ưu package.json scripts**
```json
{
  "scripts": {
    "dev": "vite --host --open",
    "dev:fast": "vite --host --open --force",
    "build": "vite build",
    "preview": "vite preview --host"
  }
}
```

### 2. **Tối ưu .env file**
```env
# .env.local
VITE_DEV_SERVER_HOST=0.0.0.0
VITE_DEV_SERVER_PORT=3000
VITE_HMR_PORT=3001
```

### 3. **Tối ưu .gitignore**
```gitignore
# Vite
.vite/
dist/
*.local

# Dependencies
node_modules/
```

## 🚀 Các lệnh tối ưu

### 1. **Chạy dev server tối ưu**
```bash
# Chạy với tối ưu tối đa
npm run dev

# Hoặc với force refresh
npm run dev:fast
```

### 2. **Clear cache khi cần**
```bash
# Xóa cache Vite
rm -rf node_modules/.vite
npm run dev

# Hoặc trên Windows
rmdir /s node_modules\.vite
npm run dev
```

### 3. **Tối ưu dependencies**
```bash
# Cài đặt dependencies tối ưu
npm install --save-dev vite-plugin-eslint

# Hoặc sử dụng yarn
yarn add -D vite-plugin-eslint
```

## 📊 Monitoring Performance

### 1. **Kiểm tra bundle size**
```bash
npm run build
# Kiểm tra thư mục dist/ để xem kích thước files
```

### 2. **Analyze bundle**
```bash
# Cài đặt bundle analyzer
npm install --save-dev rollup-plugin-visualizer

# Thêm vào vite.config.js
import { visualizer } from 'rollup-plugin-visualizer';
```

## 🎯 Tips giảm lag

### 1. **Code Splitting**
- Sử dụng `React.lazy()` cho các component lớn
- Import động các routes

### 2. **Image Optimization**
- Sử dụng WebP format
- Lazy loading cho images
- Compress images trước khi sử dụng

### 3. **CSS Optimization**
- Sử dụng CSS modules
- Tránh CSS-in-JS trong production
- Purge unused CSS

### 4. **JavaScript Optimization**
- Tránh re-renders không cần thiết
- Sử dụng `useMemo` và `useCallback`
- Code splitting cho routes

## 🔍 Debug Performance

### 1. **Vite Dev Tools**
- Mở DevTools → Network tab
- Kiểm tra thời gian load các modules
- Xem waterfall chart

### 2. **Console Commands**
```javascript
// Kiểm tra performance
console.time('render');
// Your code here
console.timeEnd('render');
```

### 3. **React DevTools**
- Cài đặt React Developer Tools
- Kiểm tra Profiler tab
- Xem component re-renders

## ⚠️ Lưu ý quan trọng

1. **Không tắt sourcemap trong production**
2. **Test trên nhiều browsers khác nhau**
3. **Monitor memory usage**
4. **Kiểm tra network latency**
5. **Sử dụng CDN cho static assets**

## 🎉 Kết quả mong đợi

- ⚡ Giảm 50-70% thời gian build
- 🚀 Tăng tốc HMR (Hot Module Replacement)
- 📦 Giảm bundle size
- 🔄 Giảm re-renders không cần thiết
- 💾 Tiết kiệm memory usage

