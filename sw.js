console.log('sw')
if ('serviceWorker' in navigator) {
	window.addEventListener('load', async function () {
		try {
			const registration = await navigator.serviceWorker.register('/sw.js', {
				scope: '/',
			})
			if (registration.installing) {
				console.log('正在安装 Service worker')
			} else if (registration.waiting) {
				console.log('已安装 Service worker installed')
			} else if (registration.active) {
				console.log('激活 Service worker')
			}

			console.log('sw')
			// 2.拦截请求（sw-proxy.js）
			self.addEventListener('fetch', async (event) => {
				event.respondWith(Promise.resolve({}))
				console.log('onfetch', event)
				const { request } = event
				let response = await fetch(request)
				// 3.重新构造Response
				response = new Response({ ...response.body, hi: 1 }, response)
				// 4.篡改响应头
				response.headers.delete('Content-Security-Policy')
				response.headers.delete('X-Frame-Options')

				event.respondWith(Promise.resolve(response))
			})
		} catch (error) {
			console.error(`注册失败：${error}`)
		}
	})
}
