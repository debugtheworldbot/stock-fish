import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { getHkValue, getShValue, Market, Stock, getSzValue } from './utils/api'
import { useAtom } from 'jotai'
import clsx from 'clsx'
import HelpDialog from './components/HelpDialog'
import { EyeClosedIcon, EyeOpenIcon } from '@radix-ui/react-icons'
import {
	codeListAtom,
	fontSizeAtom,
	showNameAtom,
	showSettingAtom,
} from './lib/store'
import { useInterval } from './lib/hooks'
import { StockItem } from './components/StockItem'

function App() {
	const [stockList, setStockList] = useState<Stock[]>([])
	const [pendingStock, setPendingStock] = useState<{
		sh: Stock | null
		sz: Stock | null
	}>({
		sh: null,
		sz: null,
	})
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

	useInterval(fetchStock, 3000)

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const target = e.target as HTMLFormElement
		const code = (target.elements[0] as HTMLInputElement).value
		const hk = (await getHkValue([code]))?.[0]
		const sh = (await getShValue([code]))?.[0]
		const sz = (await getSzValue([code]))?.[0]

		let type: Market | null = null

		if (code.length === 5 && hk) {
			type = 'hk'
		} else if (code.length === 6) {
			const existingShCode = codeList.find(
				(c) => c.code === code && c.type === 'sh'
			)
			const existingSzCode = codeList.find(
				(c) => c.code === code && c.type === 'sz'
			)

			if (existingShCode && existingSzCode) {
				return // Code already exists in both SH and SZ
			} else if (existingShCode) {
				type = 'sz'
			} else if (existingSzCode) {
				type = 'sh'
			} else if (sh && sz) {
				setPendingStock({ sh, sz })
				target.reset()
				return
			} else {
				type = sh ? 'sh' : sz ? 'sz' : null
			}
		} else {
			type = null // Invalid code length
		}

		if (!type) return
		if (codeList.some((c) => c.code === code && c.type === type)) return
		setCodeList([...codeList, { type, code }])
		target.reset()
	}

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
