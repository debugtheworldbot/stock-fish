import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { getHkValue, getShValue, Market, Stock, getSzValue } from './utils/api'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import clsx from 'clsx'
import HelpDialog from './components/HelpDialog'

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
					{showSetting ? <EyeOpen /> : <EyeClose />}
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
					<Pin />
				</button>
				<button
					onClick={() => {
						setCodeList((c) =>
							c.filter((c) => !(c.type === type && c.code === stock.code))
						)
					}}
					className='border p-0.5 rounded bg-transparent hover:bg-red-100'
				>
					<Trash />
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

const EyeOpen = () => (
	<svg
		viewBox='0 0 15 15'
		fill='none'
		xmlns='http://www.w3.org/2000/svg'
		width='1em'
		height='1em'
	>
		<path
			d='M7.5 11C4.80285 11 2.52952 9.62184 1.09622 7.50001C2.52952 5.37816 4.80285 4 7.5 4C10.1971 4 12.4705 5.37816 13.9038 7.50001C12.4705 9.62183 10.1971 11 7.5 11ZM7.5 3C4.30786 3 1.65639 4.70638 0.0760002 7.23501C-0.0253338 7.39715 -0.0253334 7.60288 0.0760014 7.76501C1.65639 10.2936 4.30786 12 7.5 12C10.6921 12 13.3436 10.2936 14.924 7.76501C15.0253 7.60288 15.0253 7.39715 14.924 7.23501C13.3436 4.70638 10.6921 3 7.5 3ZM7.5 9.5C8.60457 9.5 9.5 8.60457 9.5 7.5C9.5 6.39543 8.60457 5.5 7.5 5.5C6.39543 5.5 5.5 6.39543 5.5 7.5C5.5 8.60457 6.39543 9.5 7.5 9.5Z'
			fill='currentColor'
			fillRule='evenodd'
			clipRule='evenodd'
		></path>
	</svg>
)

const EyeClose = () => (
	<svg
		width='1em'
		height='1em'
		viewBox='0 0 15 15'
		fill='none'
		xmlns='http://www.w3.org/2000/svg'
	>
		<path
			d='M14.7649 6.07596C14.9991 6.22231 15.0703 6.53079 14.9239 6.76495C14.4849 7.46743 13.9632 8.10645 13.3702 8.66305L14.5712 9.86406C14.7664 10.0593 14.7664 10.3759 14.5712 10.5712C14.3759 10.7664 14.0593 10.7664 13.8641 10.5712L12.6011 9.30817C11.805 9.90283 10.9089 10.3621 9.93375 10.651L10.383 12.3277C10.4544 12.5944 10.2961 12.8685 10.0294 12.94C9.76267 13.0115 9.4885 12.8532 9.41704 12.5865L8.95917 10.8775C8.48743 10.958 8.00036 10.9999 7.50001 10.9999C6.99965 10.9999 6.51257 10.958 6.04082 10.8775L5.58299 12.5864C5.51153 12.8532 5.23737 13.0115 4.97064 12.94C4.7039 12.8686 4.5456 12.5944 4.61706 12.3277L5.06625 10.651C4.09111 10.3621 3.19503 9.90282 2.3989 9.30815L1.1359 10.5712C0.940638 10.7664 0.624058 10.7664 0.428798 10.5712C0.233537 10.3759 0.233537 10.0593 0.428798 9.86405L1.62982 8.66303C1.03682 8.10643 0.515113 7.46742 0.0760677 6.76495C-0.0702867 6.53079 0.000898544 6.22231 0.235065 6.07596C0.469231 5.9296 0.777703 6.00079 0.924058 6.23496C1.40354 7.00213 1.989 7.68057 2.66233 8.2427C2.67315 8.25096 2.6837 8.25972 2.69397 8.26898C4.00897 9.35527 5.65537 9.99991 7.50001 9.99991C10.3078 9.99991 12.6564 8.5063 14.076 6.23495C14.2223 6.00079 14.5308 5.9296 14.7649 6.07596Z'
			fill='currentColor'
			fillRule='evenodd'
			clipRule='evenodd'
		></path>
	</svg>
)

const Pin = () => (
	<svg
		viewBox='0 0 15 15'
		fill='none'
		xmlns='http://www.w3.org/2000/svg'
		width='1em'
		height='1em'
	>
		<path
			d='M9.62129 1.13607C9.81656 0.940808 10.1331 0.940809 10.3284 1.13607L11.3891 2.19673L12.8033 3.61094L13.8639 4.6716C14.0592 4.86687 14.0592 5.18345 13.8639 5.37871C13.6687 5.57397 13.3521 5.57397 13.1568 5.37871L12.5038 4.7257L8.86727 9.57443L9.97485 10.682C10.1701 10.8773 10.1701 11.1939 9.97485 11.3891C9.77959 11.5844 9.463 11.5844 9.26774 11.3891L7.85353 9.97491L6.79287 8.91425L3.5225 12.1846C3.32724 12.3799 3.01065 12.3799 2.81539 12.1846C2.62013 11.9894 2.62013 11.6728 2.81539 11.4775L6.08576 8.20714L5.0251 7.14648L3.61089 5.73226C3.41563 5.537 3.41562 5.22042 3.61089 5.02516C3.80615 4.8299 4.12273 4.8299 4.31799 5.02516L5.42557 6.13274L10.2743 2.49619L9.62129 1.84318C9.42603 1.64792 9.42603 1.33133 9.62129 1.13607Z'
			fill='currentColor'
			fillRule='evenodd'
			clipRule='evenodd'
		></path>
		<path
			d='M9.62129 1.13607C9.81656 0.940808 10.1331 0.940809 10.3284 1.13607L11.3891 2.19673L12.8033 3.61094L13.8639 4.6716C14.0592 4.86687 14.0592 5.18345 13.8639 5.37871C13.6687 5.57397 13.3521 5.57397 13.1568 5.37871L12.5038 4.7257L8.86727 9.57443L9.97485 10.682C10.1701 10.8773 10.1701 11.1939 9.97485 11.3891C9.77959 11.5844 9.463 11.5844 9.26774 11.3891L7.85353 9.97491L6.79287 8.91425L3.5225 12.1846C3.32724 12.3799 3.01065 12.3799 2.81539 12.1846C2.62013 11.9894 2.62013 11.6728 2.81539 11.4775L6.08576 8.20714L5.0251 7.14648L3.61089 5.73226C3.41563 5.537 3.41562 5.22042 3.61089 5.02516C3.80615 4.8299 4.12273 4.8299 4.31799 5.02516L5.42557 6.13274L10.2743 2.49619L9.62129 1.84318C9.42603 1.64792 9.42603 1.33133 9.62129 1.13607Z'
			fill='currentColor'
			fillRule='evenodd'
			clipRule='evenodd'
		></path>
	</svg>
)

const Trash = () => (
	<svg
		width='1em'
		height='1em'
		viewBox='0 0 15 15'
		fill='none'
		xmlns='http://www.w3.org/2000/svg'
	>
		<path
			d='M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H5H10H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H11V12C11 12.5523 10.5523 13 10 13H5C4.44772 13 4 12.5523 4 12V4L3.5 4C3.22386 4 3 3.77614 3 3.5ZM5 4H10V12H5V4Z'
			fill='currentColor'
			fillRule='evenodd'
			clipRule='evenodd'
		/>
	</svg>
)
