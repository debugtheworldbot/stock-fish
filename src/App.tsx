import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { getShValue, getSzValue, StockValue } from './utils/api'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
const codeListAtom = atomWithStorage<{ sh: string[]; sz: string[] }>(
	'codeList',
	{
		sh: ['000001', '399001', '399006', '600519', '510300'],
		sz: ['399002', '399007'],
	}
)

function App() {
	const [stockList, setStockList] = useState<{
		sh: StockValue[]
		sz: StockValue[]
	}>({
		sh: [],
		sz: [],
	})
	const [type, setType] = useState<'sh' | 'sz'>('sh')
	const [codeList, setCodeList] = useAtom(codeListAtom)

	const fetchStock = useCallback(async () => {
		const sh = await getShValue(codeList.sh)
		const sz = await getSzValue(codeList.sz)
		setStockList({
			sh,
			sz,
		})
	}, [codeList.sh, codeList.sz])

	useEffect(() => {
		fetchStock()
	}, [fetchStock])

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const target = e.target as HTMLFormElement
		const code = (target.elements[0] as HTMLInputElement).value
		target.reset()
		setCodeList({
			...codeList,
			[type]: [...codeList[type], code],
		})
	}

	useInterval(fetchStock, 5000)

	return (
		<main className='w-screen h-screen'>
			<iframe
				className='w-screen h-full'
				src='https://cn.bing.com/search?q=产品经理职责'
			/>
			<div className='opacity-0 hover:opacity-100 transition-all fixed bottom-0 bg-white flex w-screen p-2 pl-6 bg-transparent items-center gap-2 overflow-y-scroll flex-wrap'>
				{stockList.sh?.map((stock) => (
					<button
						onClick={() => {
							setStockList({
								...stockList,
								sh: stockList.sh.filter((s) => s.f12 !== stock.f12),
							})
							setCodeList({
								...codeList,
								sh: codeList.sh.filter((code) => code !== stock.f12),
							})
						}}
						className='hover:bg-red-400 bg-transparent px-2 py-1 rounded transition-all flex-shrink-0'
						key={stock.f14}
					>
						<span>{stock.f14} </span>
						<span>
							{stock.f4 >= 0 ? '▲' : '▼'}
							{((stock.f4 * 100) / stock.f18).toFixed(2)}%
						</span>
					</button>
				))}
				{stockList.sz?.map((stock) => (
					<button
						onClick={() => {
							setStockList({
								...stockList,
								sz: stockList.sz.filter((s) => s.f12 !== stock.f12),
							})
							setCodeList({
								...codeList,
								sz: codeList.sz.filter((code) => code !== stock.f12),
							})
						}}
						className='hover:bg-red-400 bg-transparent px-2 py-1 rounded transition-all flex-shrink-0'
						key={stock.f14}
					>
						<span>{stock.f14} </span>
						<span>
							{stock.f4 >= 0 ? '▲' : '▼'}
							{((stock.f4 * 100) / stock.f18).toFixed(2)}%
						</span>
					</button>
				))}
				<select
					onChange={(e) => setType(e.target.value as 'sh' | 'sz')}
					className='w-fit px-2 border rounded'
				>
					<option value='sh'>沪</option>
					<option value='sz'>深</option>
				</select>
				<form onSubmit={handleSubmit} className='flex gap-2 flex-shrink-0'>
					<input placeholder='股票代码' className='w-fit px-2 border rounded' />
					<button type='submit'>添加</button>
				</form>
			</div>
		</main>
	)
}

export default App

type IntervalFunction = () => unknown | void

const useInterval = (callback: IntervalFunction, delay: number | null) => {
	const savedCallback = useRef<IntervalFunction | null>(null)

	useEffect(() => {
		if (delay === null) return

		savedCallback.current = callback
	})

	useEffect(() => {
		if (delay === null) return
		function tick() {
			if (savedCallback.current !== null) {
				savedCallback.current()
			}
		}
		const id = setInterval(tick, delay)
		return () => {
			clearInterval(id)
		}
	}, [delay])
}
