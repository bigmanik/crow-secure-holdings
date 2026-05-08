 import { defineConfig } from 'vite'
 import tailwindcss from '@tailwindcss/vite'
 import { resolve } from 'path'

 export default defineConfig({
    plugins:[tailwindcss()],
     build: {
    rollupOptions: {
      input: {
        main:      resolve(__dirname, 'index.html'),      // 
        account:  resolve(__dirname, 'account.html'),   //
        dashboard: resolve(__dirname, 'dashboard.html'),  // 
        admin:     resolve(__dirname, 'admin.html'), 
         about:     resolve(__dirname, 'about.html'),      // 
      }
    }
  }
 })