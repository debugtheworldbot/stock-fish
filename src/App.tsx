import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { getShValue, getSzValue, StockValue } from './utils/api'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import clsx from 'clsx'

const defaultCodeList: { type: 'sh' | 'sz'; code: string }[] = [
	{ type: 'sh', code: '000001' },
	{ type: 'sh', code: '399001' },
	{ type: 'sh', code: '399006' },
	{ type: 'sh', code: '600519' },
	{ type: 'sh', code: '510300' },
]
const codeListAtom = atomWithStorage<{ type: 'sh' | 'sz'; code: string }[]>(
	'codeList',
	defaultCodeList
)

const fontSizeAtom = atomWithStorage<'xs' | 'sm' | 'base' | 'xl'>(
	'fontSize',
	'base'
)

const showSettingAtom = atomWithStorage<boolean>('showSetting', true)
function App() {
	const [stockList, setStockList] = useState<StockValue[]>([])
	const [codeList, setCodeList] = useAtom(codeListAtom)
	const [fontSize, setFontSize] = useAtom(fontSizeAtom)
	const [showName, setShowName] = useAtom(showNameAtom)
	const [showSetting, setShowSetting] = useAtom(showSettingAtom)

	useEffect(() => {
		if (!Array.isArray(codeList)) {
			const { sh, sz } = codeList as { sh: string[]; sz: string[] }
			setCodeList([
				...sh.map((c) => ({ type: 'sh', code: c })),
				...sz.map((c) => ({ type: 'sz' as const, code: c })),
			] as { type: 'sh' | 'sz'; code: string }[])
		}
	}, [codeList, setCodeList])

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
		sh: StockValue | null
		sz: StockValue | null
	}>({
		sh: null,
		sz: null,
	})
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const target = e.target as HTMLFormElement
		const code = (target.elements[0] as HTMLInputElement).value
		const sh = (await getShValue([code]))?.[0]
		const sz = (await getSzValue([code]))?.[0]

		let type: 'sh' | 'sz' | null = null

		if (
			codeList.some((c) => c.code === code && c.type === 'sh') &&
			codeList.some((c) => c.code === code && c.type === 'sz')
		) {
			return
		} else if (
			codeList.some((c) => c.code === code && c.type === 'sh') &&
			!codeList.some((c) => c.code === code && c.type === 'sz')
		) {
			type = 'sz'
		} else if (
			!codeList.some((c) => c.code === code && c.type === 'sh') &&
			codeList.some((c) => c.code === code && c.type === 'sz')
		) {
			type = 'sh'
		} else if (sh && sz) {
			setPendingStock({
				sh,
				sz,
			})
			target.reset()
			return
		} else {
			type = sh ? 'sh' : 'sz'
		}

		if (!type) return
		if (codeList.some((c) => c.code === code && c.type === type)) return
		setCodeList([...codeList, { type, code }])
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
					<StockItem key={index} stock={stock} type={stock.type} />
				))}

				<button
					className={clsx(
						'transition-all cursor-pointer px-2 rounded',
						showSetting ? '' : 'rotate-180'
					)}
					onClick={() => setShowSetting(!showSetting)}
				>
					{'>'}
				</button>
				{showSetting && (
					<>
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
						{pendingStock.sh && (
							<button
								className='bg-green-400 rounded px-2'
								onClick={() => {
									setCodeList([
										...codeList,
										{
											type: 'sh' as const,
											code: pendingStock.sh!.f12,
										},
									])
									setPendingStock({
										sh: null,
										sz: null,
									})
								}}
							>
								{pendingStock.sh!.f14}
							</button>
						)}
						{pendingStock.sz && (
							<button
								className='bg-green-400 rounded px-2'
								onClick={() => {
									setCodeList([
										...codeList,
										{
											type: 'sz' as const,
											code: pendingStock.sz!.f12,
										},
									])
									setPendingStock({
										sh: null,
										sz: null,
									})
								}}
							>
								{pendingStock.sz!.f14}
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
						<button className='px-2' onClick={() => setShowName(!showName)}>
							显示股票{showName ? '代码' : '名称'}
						</button>
						<a
							className='ml-2 px-2'
							href='https://jinshuju.net/f/aDbpnC'
							target='_blank'
						>
							反馈
						</a>
					</>
				)}
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

const showNameAtom = atomWithStorage<boolean>('showName', true)
const StockItem = ({
	stock,
	type,
}: {
	stock: StockValue
	type: 'sh' | 'sz'
}) => {
	const [, setCodeList] = useAtom(codeListAtom)
	const [showName, setShowName] = useAtom(showNameAtom)
	return (
		<div
			className='relative group bg-transparent px-2 py-1 rounded transition-all flex-shrink-0'
			key={stock.f14}
		>
			<div className='opacity-0 group-hover:opacity-100 transition-all absolute -top-1 right-0 flex gap-1'>
				<button
					onClick={() => {
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
						setCodeList((c) =>
							c.filter((c) => !(c.type === type && c.code === stock.f12))
						)
					}}
					className='bg-red-200 rounded px-1'
				>
					🗑
				</button>
			</div>
			<span className='cursor-pointer' onClick={() => setShowName(!showName)}>
				{showName ? stock.f14 : stock.f12} {stock.f2 / 100}
			</span>
			<span>
				{stock.f4 >= 0 ? '▲' : '▼'}
				{((stock.f4 * 100) / stock.f18).toFixed(2)}%
			</span>
		</div>
	)
}
