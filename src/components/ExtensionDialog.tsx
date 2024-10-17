import { ExternalLinkIcon } from '@radix-ui/react-icons'
import { Chrome } from 'lucide-react'
import { Button } from './ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from './ui/dialog'

export default function ExtensionDialog() {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button className='flex items-center gap-1'>
					<Chrome className='w-4' /> 在其他网页显示
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className='text-2xl font-bold text-center'>
						安装stockQuiet插件
					</DialogTitle>
					<ul className='list-disc list-inside'>
						<li>支持在任意网页底部悬浮股票信息</li>
						<li>插件里的港股信息是实时的</li>
					</ul>
					<a
						className='text-blue-500 underline text-xl flex items-center gap-1'
						target='_blank'
						href='https://chromewebstore.google.com/detail/ldafbaedegomfbhpldiiofiniehfplcp'
					>
						<ExternalLinkIcon />
						前往Chrome商店安装插件
					</a>
					<DialogDescription className='text-base'>
						tips:
						安装插件后，stockquiet.com网页显示的港股信息也会是实时的；如未安装，则显示港交所报价（港交所有15分钟延迟）
					</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	)
}
