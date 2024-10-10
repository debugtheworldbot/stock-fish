import { useAtom } from 'jotai'
import { codeListAtom, showNameAtom } from '../lib/store'
import { Stock, Market } from '@/utils/api'
import { DrawingPinIcon, TrashIcon } from '@radix-ui/react-icons'

export const StockItem = ({ stock, type }: { stock: Stock; type: Market }) => {
	const [, setCodeList] = useAtom(codeListAtom)
	const [showName, setShowName] = useAtom(showNameAtom)
	return (
		<div
			className='relative group bg-transparent px-2 py-1 rounded transition-all flex-shrink-0'
			key={stock.name}
		>
			<div className='opacity-0 group-hover:opacity-100 transition-all absolute -top-1 right-0 flex gap-1'>
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
					<DrawingPinIcon className='w-[0.8em] h-[0.8em]' />
				</button>
				<button
					onClick={() => {
						setCodeList((c) =>
							c.filter((c) => !(c.type === type && c.code === stock.code))
						)
					}}
					className='border p-0.5 rounded bg-transparent hover:bg-red-100'
				>
					<TrashIcon className='w-[0.8em] h-[0.8em]' />
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
