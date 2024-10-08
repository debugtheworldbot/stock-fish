console.log('sw')
if ('serviceWorker' in navigator) {
	window.addEventListener('load', function () {
		navigator.serviceWorker.register('./sw-proxy.js')

		console.log('sw')
		// 2.拦截请求（sw-proxy.js）
		self.addEventListener('fetch', async (event) => {
			console.log('fetch', event)
			const { request } = event
			let response = await fetch(request)
			// 3.重新构造Response
			response = new Response(response.body, response)
			// 4.篡改响应头
			response.headers.delete('Content-Security-Policy')
			response.headers.delete('X-Frame-Options')

			event.respondWith(Promise.resolve(originalResponse))
		})
	})
}
