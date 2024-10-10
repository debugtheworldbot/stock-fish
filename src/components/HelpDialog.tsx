import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from './ui/dialog'
import { QuestionMarkCircledIcon } from '@radix-ui/react-icons'

export default function HelpDialog() {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<button className='p-1 rounded'>
					<QuestionMarkCircledIcon className='w-[1em] h-[1em]' />
				</button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className='text-2xl font-bold text-center'>
						帮助
					</DialogTitle>
					<h2 className='text-xl'>目前支持的功能</h2>
					<ul className='list-disc list-inside'>
						<li>支持添加A股/港股/场内基金代码</li>
						<li>所有数据每3秒更新一次</li>
						<li>可调整字体大小</li>
						<li>支持显示股票代码/名称切换</li>
						<li>支持置顶和删除一支股票</li>
						<li>所有内容都保存在本地，不会上传到服务器</li>
					</ul>
					<DialogDescription className='text-base'>
						tips: 添加A股需输入6位数代码，例如贵州茅台为
						<span className='font-mono'>600519</span>,
						港股需输入5位数代码，例如腾讯为
						<span className='font-mono'>00700</span>
					</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	)
}
