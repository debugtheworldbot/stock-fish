import { codeListAtom, fontSizeAtom, showSettingAtom } from '@/lib/store'
import { showNameAtom } from '@/lib/store'
import { getHkValue, getShValue, getSzValue, Market, Stock } from '@/utils/api'
import {
	CodeIcon,
	EyeClosedIcon,
	EyeOpenIcon,
	TextIcon,
} from '@radix-ui/react-icons'
import clsx from 'clsx'
import { useAtom } from 'jotai'
import React, { useState } from 'react'
import HelpDialog from './HelpDialog'

export default function Settings() {
	const [showSetting, setShowSetting] = useAtom(showSettingAtom)
	const [codeList, setCodeList] = useAtom(codeListAtom)
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
		<>
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
					<FontSizeSelect />
					<NameSwitch />
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
		</>
	)
}

const FontSizeSelect = () => {
	const [fontSize, setFontSize] = useAtom(fontSizeAtom)
	return (
		<div className='flex items-center gap-2 border rounded px-2'>
			字号
			<select
				value={fontSize}
				onChange={(e) =>
					setFontSize(e.target.value as 'xs' | 'sm' | 'base' | 'xl')
				}
				className='cursor-pointer rounded'
			>
				<option value='xs'>最小</option>
				<option value='sm'>小</option>
				<option value='base'>中</option>
				<option value='xl'>大</option>
			</select>
		</div>
	)
}

const NameSwitch = () => {
	const [showName, setShowName] = useAtom(showNameAtom)
	return (
		<button
			className='px-2 rounded flex items-center gap-1'
			onClick={() => setShowName(!showName)}
		>
			{showName ? (
				<CodeIcon className='w-[1em] h-[1em]' />
			) : (
				<TextIcon className='w-[1em] h-[1em]' />
			)}
			显示股票{showName ? '代码' : '名称'}
		</button>
	)
}
