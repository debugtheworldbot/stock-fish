import axios from 'axios'

export const getShValue = async (
	stockCodeList: string[]
): Promise<StockValue[]> => {
	const idListStr = stockCodeList.map((code) => `1.${code}`).join(',')
	const response = await axios.get(
		`https://push2.eastmoney.com/api/qt/ulist.np/get?fields=f1,f14,f2,f12,f5,f18,f4&secids=${idListStr}`
	)
	const stocks = response.data.data?.diff
	return stocks?.map((stock: StockValue) => ({ ...stock, type: 'sh' }))
}
export const getSzValue = async (
	stockCodeList: string[]
): Promise<StockValue[]> => {
	const idListStr = stockCodeList.map((code) => `0.${code}`).join(',')
	const response = await axios.get(
		`https://push2.eastmoney.com/api/qt/ulist.np/get?fields=f1,f14,f2,f12,f5,f18,f4&secids=${idListStr}`
	)
	const stocks = response.data.data?.diff
	return stocks?.map((stock: StockValue) => ({ ...stock, type: 'sz' }))
}

export const getStockValue = async (
	stockCodeList: string[]
): Promise<StockValue[]> => {
	const sh = (await getShValue(stockCodeList)) || []
	const sz = (await getSzValue(stockCodeList)) || []
	return [...sh, ...sz]
}

export type StockValue = {
	f1: number
	f2: number // 现价
	f4: number // 股票涨跌
	f5: number // 成交量
	f12: string // 股票代码
	f14: string // 股票名称
	f18: number // 开盘价
	type: 'sh' | 'sz'
}
