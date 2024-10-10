import axios from 'axios'

export const getShValue = async (stockCodeList: string[]): Promise<Stock[]> => {
	if (stockCodeList.length === 0) return []
	const idListStr = stockCodeList.map((code) => `1.${code}`).join(',')
	const response = await axios.get(
		`https://push2.eastmoney.com/api/qt/ulist.np/get?fields=f1,f14,f2,f12,f5,f18,f4&secids=${idListStr}`
	)
	const stocks = response.data.data?.diff as StockValue[]
	return (
		stocks?.map((stock: StockValue) => ({
			type: 'sh',
			name: stock.f14,
			code: stock.f12,
			current: (stock.f2 / 100).toFixed(2),
			percent: (stock.f4 * 100) / stock.f18,
		})) || []
	)
}
export const getSzValue = async (stockCodeList: string[]): Promise<Stock[]> => {
	if (stockCodeList.length === 0) return []
	const idListStr = stockCodeList.map((code) => `0.${code}`).join(',')
	const response = await axios.get(
		`https://push2.eastmoney.com/api/qt/ulist.np/get?fields=f1,f14,f2,f12,f5,f18,f4&secids=${idListStr}`
	)
	const stocks = response.data.data?.diff as StockValue[]
	return (
		stocks?.map((stock: StockValue) => ({
			type: 'sz',
			name: stock.f14,
			code: stock.f12,
			current: (stock.f2 / 100).toFixed(2),
			percent: (stock.f4 * 100) / stock.f18,
		})) || []
	)
}

export const getStockValue = async (
	stockCodeList: string[]
): Promise<Stock[]> => {
	const sh = (await getShValue(stockCodeList)) || []
	const sz = (await getSzValue(stockCodeList)) || []
	const hk = (await getHkValue(stockCodeList)) || []
	return [...sh, ...sz, ...hk]
}

export const getHkValue = async (stockCodeList: string[]): Promise<Stock[]> => {
	if (stockCodeList.length === 0) return []
	const idListStr = stockCodeList.map((code) => `s_hk${code}`).join(',')

	const response = await axios.get(`https://qt.gtimg.cn/q=${idListStr}`)
	const stocks = convertToStockArray(response.data)
	return (
		stocks?.map((stock: Stock) => ({
			type: 'hk',
			name: stock.name,
			code: stock.code,
			current: parseFloat(stock.current).toFixed(2),
			percent: stock.percent,
		})) || []
	)
}

type StockValue = {
	f1: number
	f2: number // 现价
	f4: number // 股票涨跌
	f5: number // 成交量
	f12: string // 股票代码
	f14: string // 股票名称
	f18: number // 开盘价
	type: Market
}

export type Market = 'sh' | 'sz' | 'hk'

export type Stock = {
	code: string
	name: string
	current: string
	percent: number
	type: Market
}

const convertToStockArray = (rawData: string): Stock[] => {
	return rawData
		.trim()
		.split(';')
		.filter(Boolean)
		.map((stockData) => {
			const [, stockInfo] = stockData.split('=')
			const [, name, code, current, , percent] = stockInfo
				.replace(/"/g, '')
				.split('~')
			return {
				code,
				name,
				current,
				percent: parseFloat(percent),
				type: 'hk' as Market,
			}
		})
}
