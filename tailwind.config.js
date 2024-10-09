/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	safelist: ['text-lg', 'text-sm', 'text-xs', 'text-base'],
	theme: {
		extend: {
			fontSize: {
				xs: '0.75rem',
				sm: '0.875rem',
				base: '1rem',
				xl: '1.25rem',
			},
		},
	},
	plugins: [],
}
