import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			manifest: {
				name: '股票',
				short_name: '股票',
				theme_color: '#ffffff',
				id: 'com.keke.stock',
			},
			registerType: 'autoUpdate',
			injectRegister: 'auto',
			devOptions: {
				enabled: true,
				/* other options */
			},
		}),
	],
})
