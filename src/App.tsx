import {
	Dispatch,
	SetStateAction,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react'
import './App.css'
import { getShValue, getSzValue, StockValue } from './utils/api'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import clsx from 'clsx'

const codeListAtom = atomWithStorage<{ type: 'sh' | 'sz'; code: string }[]>(
	'codeList',
	[
		{ type: 'sh', code: '000001' },
		{ type: 'sh', code: '399001' },
		{ type: 'sh', code: '399006' },
		{ type: 'sh', code: '600519' },
		{ type: 'sh', code: '510300' },
		{ type: 'sz', code: '399002' },
		{ type: 'sz', code: '399007' },
	]
)

const fontSizeAtom = atomWithStorage<'xs' | 'sm' | 'base' | 'xl'>(
	'fontSize',
	'base'
)

function App() {
	const [stockList, setStockList] = useState<StockValue[]>([])
	const [codeList, setCodeList] = useAtom(codeListAtom)
	const [fontSize, setFontSize] = useAtom(fontSizeAtom)

	const fetchStock = useCallback(async () => {
		const shCodes = codeList.filter((c) => c.type === 'sh').map((c) => c.code)
		const szCodes = codeList.filter((c) => c.type === 'sz').map((c) => c.code)

		const [sh, sz] = await Promise.all([
			getShValue(shCodes),
			getSzValue(szCodes),
		])

		const orderedStocks = codeList
			.map(({ type, code }) => {
				const stockList = type === 'sh' ? sh : sz
				return stockList.find((stock) => stock.f12 === code)
			})
			.filter(Boolean) as StockValue[]
		setStockList(orderedStocks)
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
			setCodeList([
				...codeList.filter((c) => c.type === 'sh'),
				{ type: 'sh', code },
			])
		} else if (sz.length > 0) {
			setCodeList([
				...codeList.filter((c) => c.type === 'sz'),
				{ type: 'sz', code },
			])
		}
		target.reset()
	}

	useInterval(fetchStock, 3000)

	return (
		<main className='w-screen h-screen'>
			<iframe
				className='w-screen h-full'
				src='https://cn.bing.com/search?q=这里可以搜索任何想搜的'
			/>
			<div
				className={clsx(
					`transition-all fixed bottom-0 bg-white flex w-screen p-2 pl-6 bg-transparent items-center gap-2 overflow-y-scroll flex-wrap`,
					`text-${fontSize}`
				)}
			>
				{stockList.map((stock, index) => (
					<StockItem
						key={index}
						stock={stock}
						setStockList={setStockList}
						type={stock.type}
					/>
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
								...pendingStock.sh,
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
								...pendingStock.sz,
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

const StockItem = ({
	stock,
	setStockList,
	type,
}: {
	stock: StockValue
	setStockList: Dispatch<SetStateAction<StockValue[]>>
	type: 'sh' | 'sz'
}) => {
	const [, setCodeList] = useAtom(codeListAtom)
	return (
		<div
			className='relative group bg-transparent px-2 py-1 rounded transition-all flex-shrink-0'
			key={stock.f14}
		>
			<div className='opacity-0 group-hover:opacity-100 transition-all absolute -top-1 right-0 flex gap-1'>
				<button
					onClick={() => {
						setStockList((s) => {
							const index = s.findIndex(
								(s) => s.f12 === stock.f12 && s.type === type
							)
							if (index === -1) return s
							const newStock = [...s.slice(0, index), ...s.slice(index + 1)]
							newStock.unshift(stock)
							return newStock
						})
						setCodeList((c) => {
							const index = c.findIndex(
								(c) => c.type === type && c.code === stock.f12
							)
							if (index === -1) return c
							const newCodeList = [...c.slice(0, index), ...c.slice(index + 1)]
							newCodeList.unshift({ type, code: stock.f12 })
							return newCodeList
						})
					}}
					className='bg-green-200 rounded px-1'
				>
					📌
				</button>
				<button
					onClick={() => {
						setStockList((s) =>
							s.filter((s) => !(s.type === type && s.f12 === stock.f12))
						)
						setCodeList((c) =>
							c.filter((c) => !(c.type === type && c.code === stock.f12))
						)
					}}
					className='bg-red-200 rounded px-1'
				>
					🗑
				</button>
			</div>
			<span>
				{stock.f14} {stock.f2 / 100}
			</span>
			<span>
				{stock.f4 >= 0 ? '▲' : '▼'}
				{((stock.f4 * 100) / stock.f18).toFixed(2)}%
			</span>
		</div>
	)
}
