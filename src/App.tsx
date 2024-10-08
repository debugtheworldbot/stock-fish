import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { getStockValue, StockValue } from './utils/api'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
const codeListAtom = atomWithStorage<string[]>('codeList', [])

function App() {
	const [stockList, setStockList] = useState<StockValue[]>([])
	const [codeList, setCodeList] = useAtom(codeListAtom)

	const fetchStock = useCallback(() => {
		getStockValue(codeList).then((res) => {
			setStockList(res)
		})
	}, [codeList])
	useEffect(() => {
		fetchStock()
	}, [fetchStock])

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const target = e.target as HTMLFormElement
		const code = (target.elements[0] as HTMLInputElement).value
		target.reset()
		setCodeList([...codeList, code])
	}

	return (
		<main className='w-screen min-h-screen'>
			<iframe className='w-screen h-screen' src='https://www.baidu.com' />
			<button
				onClick={fetchStock}
				className='flex w-full py-2 bg-transparent justify-center items-center gap-2'
			>
				{stockList.map((stock) => (
					<button
						onClick={() => {
							setCodeList(codeList.filter((code) => code !== stock.f12))
						}}
						className='hover:bg-red-400 bg-transparent px-2 py-1 rounded transition-all'
						key={stock.f12}
					>
						<span>{stock.f14} </span>
						<span>
							{stock.f4 >= 0 ? '▲' : '▼'}
							{(stock.f4 / stock.f18).toFixed(2)}%
						</span>
					</button>
				))}
				<form onSubmit={handleSubmit} className='flex gap-2'>
					<input placeholder='股票代码' className='w-fit border rounded' />
					<button type='submit'>添加</button>
				</form>
			</button>
		</main>
	)
}

export default App
