/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ['class'],
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
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			colors: {},
		},
	},
	plugins: [require('tailwindcss-animate')],
}
