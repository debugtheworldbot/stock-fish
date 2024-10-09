import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { getShValue, getSzValue, StockValue } from './utils/api'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import clsx from 'clsx'
const codeListAtom = atomWithStorage<{ sh: string[]; sz: string[] }>(
	'codeList',
	{
		sh: ['000001', '399001', '399006', '600519', '510300'],
		sz: ['399002', '399007'],
	}
)

const fontSizeAtom = atomWithStorage<'xs' | 'sm' | 'base' | 'xl'>(
	'fontSize',
	'base'
)

function App() {
	const [stockList, setStockList] = useState<{
		sh: StockValue[]
		sz: StockValue[]
	}>({
		sh: [],
		sz: [],
	})
	const [codeList, setCodeList] = useAtom(codeListAtom)
	const [fontSize, setFontSize] = useAtom(fontSizeAtom)

	const fetchStock = useCallback(async () => {
		const sh = await getShValue(codeList.sh)
		const sz = await getSzValue(codeList.sz)
		setStockList({
			sh,
			sz,
		})
	}, [codeList])

	useEffect(() => {
		fetchStock()
	}, [fetchStock])

	const [pendingStock, setPendingStock] = useState<{
		sh: StockValue[]
		sz: StockValue[]
	}>({
		sh: [],
		sz: [],
	})
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const target = e.target as HTMLFormElement
		const code = (target.elements[0] as HTMLInputElement).value
		const sh = (await getShValue([code])) || []
		const sz = (await getSzValue([code])) || []
		if (sh.length > 0 && sz.length > 0) {
			setPendingStock({
				sh,
				sz,
			})
		} else if (sh.length > 0) {
			setCodeList({
				...codeList,
				sh: [...codeList.sh, code],
			})
		} else if (sz.length > 0) {
			setCodeList({
				...codeList,
				sz: [...codeList.sz, code],
			})
		}
		target.reset()
	}

	useInterval(fetchStock, 3000)

	return (
		<main className='w-screen h-screen'>
			{/* {!isDev && ( */}
			<iframe
				className='w-screen h-full'
				src='https://cn.bing.com/search?q=这里可以搜索任何想搜的'
			/>
			{/* )} */}
			<div
				className={clsx(
					`transition-all fixed bottom-0 bg-white flex w-screen p-2 pl-6 bg-transparent items-center gap-2 overflow-y-scroll flex-wrap`,
					fontSize === 'xs' && 'text-xs',
					fontSize === 'sm' && 'text-sm',
					fontSize === 'base' && 'text-base',
					fontSize === 'xl' && 'text-xl'
				)}
			>
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
						<span>
							{stock.f14} {stock.f2 / 100}
						</span>
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
						<span>
							{stock.f14} {stock.f2 / 100}
						</span>
						<span>
							{stock.f4 >= 0 ? '▲' : '▼'}
							{((stock.f4 * 100) / stock.f18).toFixed(2)}%
						</span>
					</button>
				))}
				<form onSubmit={handleSubmit} className='flex gap-2 flex-shrink-0'>
					<input
						maxLength={6}
						minLength={5}
						required
						type='number'
						placeholder='股票/场内基金代码'
						className='w-fit px-2 border rounded'
					/>
					<button className='px-2' type='submit'>
						添加
					</button>
				</form>
				{pendingStock.sh.length > 0 && (
					<button
						className='bg-green-400 rounded px-2'
						onClick={() => {
							setStockList({
								...stockList,
								sh: [...stockList.sh, ...pendingStock.sh],
							})
							setPendingStock({
								sh: [],
								sz: [],
							})
						}}
					>
						{pendingStock.sh.map((stock) => (
							<span>{stock.f14}</span>
						))}
					</button>
				)}
				{pendingStock.sz.length > 0 && (
					<button
						className='bg-green-400 rounded px-2'
						onClick={() => {
							setStockList({
								...stockList,
								sz: [...stockList.sz, ...pendingStock.sz],
							})
							setPendingStock({
								sh: [],
								sz: [],
							})
						}}
					>
						{pendingStock.sz.map((stock) => (
							<span>{stock.f14}</span>
						))}
					</button>
				)}
				<div className='flex items-center gap-2 border rounded px-2'>
					字号:
					<select
						value={fontSize}
						onChange={(e) =>
							setFontSize(e.target.value as 'xs' | 'sm' | 'base' | 'xl')
						}
						className='cursor-pointer'
					>
						<option value='xs'>最小</option>
						<option value='sm'>小</option>
						<option value='base'>中</option>
						<option value='xl'>大</option>
					</select>
				</div>
				<a
					className='ml-2 px-2'
					href='https://jinshuju.net/f/aDbpnC'
					target='_blank'
				>
					反馈
				</a>
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
