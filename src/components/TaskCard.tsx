import { Task, TaskPriority } from '@/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, MoreHorizontal, User, Edit2, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TaskCardProps {
  task: Task
  onEdit?: () => void
  onDelete?: () => void
}

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  high: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

export default function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  return (
    <Card className="p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <div className="flex justify-between items-start mb-2">
        <Badge variant="secondary" className={`capitalize font-medium ${priorityColors[task.priority]}`}>
          {task.priority}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center -mr-2 -mt-1 rounded-full outline-none hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.()}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete?.()} className="text-red-600 focus:text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1 leading-snug">
        {task.title}
      </h4>
      
      {task.description && (
        <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">
          {task.description}
        </p>
      )}
      
      <div className="flex items-center justify-between mt-4">
        {task.dueDate ? (
          <div className="flex items-center text-xs text-slate-400 font-medium">
            <Clock className="mr-1 h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString()}
          </div>
        ) : <div />}
        
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <User className="h-3 w-3 text-slate-400" />
          </div>
        </div>
      </div>
    </Card>
  )
}
