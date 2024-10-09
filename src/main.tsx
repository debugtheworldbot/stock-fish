import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { inject } from '@vercel/analytics'

inject()

if ('serviceWorker' in navigator) {
	console.log('serviceWorker in navigator')
	navigator.serviceWorker.getRegistrations().then((registrations) => {
		for (const registration of registrations) {
			registration.unregister()
		}
	})
}
createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>
)
