'use client'

import { useState } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

import { type AvatarItem } from './components/avatar-upload-dialog'
import { BloggerCard } from './components/blogger-card'

export type BloggerStatus = 'recent' | 'disconnected'

export interface Blogger {
	name: string
	avatar: string
	url: string
	description: string
	stars: number
	status?: BloggerStatus
}

interface GridViewProps {
	bloggers: Blogger[]
	isEditMode?: boolean
	onUpdate?: (blogger: Blogger, oldBlogger: Blogger, avatarItem?: AvatarItem) => void
	onDelete?: (blogger: Blogger) => void
	onReorder?: (bloggers: Blogger[]) => void
}

function SortableItem({ blogger, isEditMode, onUpdate, onDelete }: { blogger: Blogger; isEditMode?: boolean; onUpdate?: (blogger: Blogger, oldBlogger: Blogger, avatarItem?: AvatarItem) => void; onDelete?: (blogger: Blogger) => void }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: blogger.url })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1
	}

	return (
		<div ref={setNodeRef} style={style} className='relative'>
			{isEditMode && (
				<div className='absolute left-2 top-1/2 z-20 -translate-y-1/2 cursor-grab active:cursor-grabbing' {...attributes} {...listeners}>
					<GripVertical className='h-5 w-5 text-gray-400 hover:text-gray-600' />
				</div>
			)}
			<div className={isEditMode ? 'pl-8' : ''}>
				<BloggerCard blogger={blogger} isEditMode={isEditMode} onUpdate={onUpdate} onDelete={() => onDelete?.(blogger)} />
			</div>
		</div>
	)
}

export default function GridView({ bloggers, isEditMode = false, onUpdate, onDelete, onReorder }: GridViewProps) {
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedCategory, setSelectedCategory] = useState<BloggerStatus>('recent')

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates
		})
	)

	const filteredBloggers = bloggers.filter(blogger => {
		const status = blogger.status ?? 'recent'
		const matchesCategory = status === selectedCategory
		const matchesSearch =
			blogger.name.toLowerCase().includes(searchTerm.toLowerCase()) || blogger.description.toLowerCase().includes(searchTerm.toLowerCase())
		return matchesCategory && matchesSearch
	})

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event

		if (over && active.id !== over.id) {
			const activeUrl = active.id as string
			const overUrl = over.id as string

			const activeIndex = filteredBloggers.findIndex(b => b.url === activeUrl)
			const overIndex = filteredBloggers.findIndex(b => b.url === overUrl)

			if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
				const newFilteredBloggers = arrayMove(filteredBloggers, activeIndex, overIndex)
				
				const filteredUrls = new Set(filteredBloggers.map(b => b.url))
				const newBloggers: Blogger[] = []
				let filteredIndex = 0

				for (const blogger of bloggers) {
					if (filteredUrls.has(blogger.url)) {
						newBloggers.push(newFilteredBloggers[filteredIndex])
						filteredIndex++
					} else {
						newBloggers.push(blogger)
					}
				}

				onReorder?.(newBloggers)
			}
		}
	}

	return (
		<div className='mx-auto w-full max-w-7xl px-6 pt-24 pb-12'>
			<div className='mb-8 space-y-4'>
				<input
					type='text'
					placeholder='搜索博主...'
					value={searchTerm}
					onChange={e => setSearchTerm(e.target.value)}
					className='focus:ring-brand mx-auto block w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:outline-none'
				/>

				<div className='flex flex-wrap justify-center gap-2'>
					<button
						onClick={() => setSelectedCategory('recent')}
						className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
							selectedCategory === 'recent' ? 'bg-brand text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
						}`}>
						我的朋友
					</button>
					<button
						onClick={() => setSelectedCategory('disconnected')}
						className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
							selectedCategory === 'disconnected' ? 'bg-brand text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
						}`}>
						大佬博客
					</button>
				</div>
			</div>

			<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
				<SortableContext items={filteredBloggers.map(b => b.url)} strategy={rectSortingStrategy}>
					<div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
						{filteredBloggers.map(blogger => (
							<SortableItem key={blogger.url} blogger={blogger} isEditMode={isEditMode} onUpdate={onUpdate} onDelete={() => onDelete?.(blogger)} />
						))}
					</div>
				</SortableContext>
			</DndContext>

			{filteredBloggers.length === 0 && (
				<div className='mt-12 text-center text-gray-500'>
					<p>没有找到相关博主</p>
				</div>
			)}
		</div>
	)
}
