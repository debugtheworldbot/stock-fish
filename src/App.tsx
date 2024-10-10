import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { getHkValue, getShValue, Market, Stock, getSzValue } from './utils/api'
import { useAtom } from 'jotai'
import clsx from 'clsx'
import { codeListAtom, fontSizeAtom } from './lib/store'
import { useInterval } from './lib/hooks'
import { StockItem } from './components/StockItem'
import Settings from './components/Settings'

function App() {
	const [stockList, setStockList] = useState<Stock[]>([])
	const [codeList, setCodeList] = useAtom(codeListAtom)
	const [fontSize] = useAtom(fontSizeAtom)

	useEffect(() => {
		if (!Array.isArray(codeList)) {
			const { sh, sz } = codeList as { sh: string[]; sz: string[] }
			setCodeList([
				...sh.map((c) => ({ type: 'sh', code: c })),
				...sz.map((c) => ({ type: 'sz' as const, code: c })),
			] as { type: Market; code: string }[])
		}
	}, [codeList, setCodeList])

	const fetchStock = useCallback(async () => {
		const shCodes = codeList.filter((c) => c.type === 'sh').map((c) => c.code)
		const szCodes = codeList.filter((c) => c.type === 'sz').map((c) => c.code)
		const hkCodes = codeList.filter((c) => c.type === 'hk').map((c) => c.code)

		const [sh, sz, hk] = await Promise.all([
			getShValue(shCodes),
			getSzValue(szCodes),
			getHkValue(hkCodes),
		])

		const orderedStocks = codeList
			.map(({ type, code }) => {
				const stockList = type === 'sh' ? sh : type === 'sz' ? sz : hk
				return stockList.find((stock) => stock.code === code)
			})
			.filter(Boolean) as Stock[]
		setStockList(orderedStocks)
	}, [codeList])

	useEffect(() => {
		fetchStock()
	}, [fetchStock])

	useInterval(fetchStock, 3000)

	return (
		<main className='w-screen h-screen'>
			<iframe
				className='w-screen h-full'
				src='https://cn.bing.com/search?q=这里可以搜索任何想搜的'
			/>
			<div
				className={clsx(
					`transition-all fixed bottom-0 bg-white/80 backdrop-blur flex w-screen pl-6 items-center gap-2 overflow-y-scroll flex-wrap`,
					`text-${fontSize}`,
					fontSize === 'xs' ? 'py-0.5' : 'py-1'
				)}
			>
				{stockList.map((stock, index) => (
					<StockItem key={index} stock={stock} type={stock.type} />
				))}
				<Settings />
			</div>
		</main>
	)
}

export default App
