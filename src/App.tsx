import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { getHkValue, getShValue, Market, Stock, getSzValue } from './utils/api'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import clsx from 'clsx'
import HelpDialog from './components/HelpDialog'
import {
	DrawingPinIcon,
	EyeClosedIcon,
	EyeOpenIcon,
	TrashIcon,
} from '@radix-ui/react-icons'

const defaultCodeList: { type: Market; code: string }[] = [
	{ type: 'sh', code: '000001' },
	{ type: 'sh', code: '399001' },
	{ type: 'sh', code: '399006' },
	{ type: 'sh', code: '600519' },
	{ type: 'sh', code: '510300' },
	{ type: 'hk', code: '00700' },
]
const codeListAtom = atomWithStorage<{ type: Market; code: string }[]>(
	'codeList',
	defaultCodeList
)

const fontSizeAtom = atomWithStorage<'xs' | 'sm' | 'base' | 'xl'>(
	'fontSize',
	'base'
)

const showSettingAtom = atomWithStorage<boolean>('showSetting', true)
function App() {
	const [stockList, setStockList] = useState<Stock[]>([])
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

	const [pendingStock, setPendingStock] = useState<{
		sh: Stock | null
		sz: Stock | null
	}>({
		sh: null,
		sz: null,
	})
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const target = e.target as HTMLFormElement
		const code = (target.elements[0] as HTMLInputElement).value
		const hk = (await getHkValue([code]))?.[0]
		const sh = (await getShValue([code]))?.[0]
		const sz = (await getSzValue([code]))?.[0]

		console.log('hk', hk)
		let type: Market | null = null

		if (code.length === 5 && hk) {
			type = 'hk'
		} else if (
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

				<div
					className={clsx(
						'py-2 transition-all cursor-pointer px-2 rounded',
						showSetting ? '' : 'rotate-180'
					)}
					onClick={() => setShowSetting(!showSetting)}
				>
					{showSetting ? (
						<EyeOpenIcon className='w-[1em] h-[1em]' />
					) : (
						<EyeClosedIcon className='w-[1em] h-[1em]' />
					)}
				</div>
				{showSetting && (
					<>
						<form onSubmit={handleSubmit} className='flex gap-2 flex-shrink-0'>
							<input
								maxLength={6}
								minLength={5}
								required
								type='number'
								placeholder='A股/港股/场内基金代码'
								className='w-fit px-2 border rounded'
							/>
							<button className='px-2 rounded' type='submit'>
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
											code: pendingStock.sh!.code,
										},
									])
									setPendingStock({
										sh: null,
										sz: null,
									})
								}}
							>
								{pendingStock.sh!.name}
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
											code: pendingStock.sz!.code,
										},
									])
									setPendingStock({
										sh: null,
										sz: null,
									})
								}}
							>
								{pendingStock.sz!.name}
							</button>
						)}
						<div className='flex items-center gap-2 border rounded px-2'>
							字号
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
							⇄显示股票{showName ? '代码' : '名称'}
						</button>
						<a
							className='ml-2 px-2'
							href='https://jinshuju.net/f/aDbpnC'
							target='_blank'
						>
							反馈
						</a>
						<HelpDialog />
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
const StockItem = ({ stock, type }: { stock: Stock; type: Market }) => {
	const [, setCodeList] = useAtom(codeListAtom)
	const [showName, setShowName] = useAtom(showNameAtom)
	return (
		<div
			className='relative group bg-transparent px-2 py-1 rounded transition-all flex-shrink-0'
			key={stock.name}
		>
			<div className='opacity-0 group-hover:opacity-100 transition-all absolute -top-2 right-0 flex gap-1'>
				<button
					onClick={() => {
						setCodeList((c) => {
							const index = c.findIndex(
								(c) => c.type === type && c.code === stock.code
							)
							if (index === -1) return c
							const newCodeList = [...c.slice(0, index), ...c.slice(index + 1)]
							newCodeList.unshift({ type, code: stock.code })
							return newCodeList
						})
					}}
					className='border p-0.5 rounded bg-transparent hover:bg-green-100'
				>
					<DrawingPinIcon className='w-[1em] h-[1em]' />
				</button>
				<button
					onClick={() => {
						setCodeList((c) =>
							c.filter((c) => !(c.type === type && c.code === stock.code))
						)
					}}
					className='border p-0.5 rounded bg-transparent hover:bg-red-100'
				>
					<TrashIcon className='w-[1em] h-[1em]' />
				</button>
			</div>
			<span className='cursor-pointer' onClick={() => setShowName(!showName)}>
				{showName ? stock.name : stock.code}
			</span>
			<span className='font-mono'> {stock.current}</span>
			<span>{stock.percent >= 0 ? '△' : '▽'}</span>
			<span className='font-mono'>{stock.percent.toFixed(2)}%</span>
		</div>
	)
}
