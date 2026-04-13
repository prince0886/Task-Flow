import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import apiClient from '@/services/api'
import { Project, Task, TaskStatus } from '@/types'
import AppLayout from '@/components/AppLayout'
import TaskCard from '@/components/TaskCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, ArrowLeft, Search, MoreVertical, AlertCircle, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import TaskFormDialog from '@/components/TaskFormDialog'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { toast } from 'sonner'

const STATUS_COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'bg-slate-400' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { id: 'done', label: 'Completed', color: 'bg-emerald-500' },
]

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo')

  // ---- Filter & search state ----
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [assigneeFilter, setAssigneeFilter] = useState('')

  const openTaskDialog = (status: TaskStatus = 'todo', task: Task | null = null) => {
    setDefaultStatus(status)
    setEditingTask(task)
    setIsTaskDialogOpen(true)
  }

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const response = await apiClient.get<Project>(`/projects/${id}`)
      return response.data
    },
  })

  const { data: tasks, isLoading: tasksLoading, isError: tasksError } = useQuery({
    queryKey: ['projects', id, 'tasks'],
    queryFn: async () => {
      const response = await apiClient.get<Task[]>(`/projects/${id}/tasks`)
      return response.data
    },
  })

  // ---- Fix: PATCH instead of PUT ----
  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const res = await apiClient.patch(`/tasks/${taskId}`, { status })
      return res.data
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['projects', id, 'tasks'] })
      const previousTasks = queryClient.getQueryData<Task[]>(['projects', id, 'tasks'])
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(['projects', id, 'tasks'], old =>
          old?.map(task => task.id === taskId ? { ...task, status } : task)
        )
      }
      return { previousTasks }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['projects', id, 'tasks'], context.previousTasks)
      }
      toast.error('Failed to update task status')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', id, 'tasks'] })
    },
  })

  // ---- Delete with undo toast ----
  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      await apiClient.delete(`/tasks/${taskId}`)
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['projects', id, 'tasks'] })
      const previousTasks = queryClient.getQueryData<Task[]>(['projects', id, 'tasks'])
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(['projects', id, 'tasks'], old =>
          old?.filter(task => task.id !== taskId)
        )
      }
      return { previousTasks }
    },
    onSuccess: (_data, _taskId, context) => {
      // Show undo toast
      toast('Task deleted', {
        action: {
          label: 'Undo',
          onClick: () => {
            // Restore from the snapshot
            if (context?.previousTasks) {
              queryClient.setQueryData(['projects', id, 'tasks'], context.previousTasks)
              queryClient.invalidateQueries({ queryKey: ['projects', id, 'tasks'] })
            }
          },
        },
      })
    },
    onError: (_err, _taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['projects', id, 'tasks'], context.previousTasks)
      }
      toast.error('Failed to delete task')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', id, 'tasks'] })
    },
  })

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return
    updateTaskStatus.mutate({
      taskId: draggableId,
      status: destination.droppableId as TaskStatus,
    })
  }

  const isLoading = projectLoading || tasksLoading

  // ---- Collect unique assignees for filter dropdown ----
  const assignees = Array.from(
    new Set((tasks ?? []).map(t => t.assigneeId).filter(Boolean))
  ) as string[]

  // ---- Master filter function ----
  const getFilteredTasks = (columnStatus: TaskStatus) => {
    return (tasks ?? []).filter(t => {
      const matchesColumn = t.status === columnStatus
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter
      const matchesSearch = !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchesAssignee = !assigneeFilter || t.assigneeId === assigneeFilter
      return matchesColumn && matchesStatus && matchesSearch && matchesAssignee
    })
  }

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || assigneeFilter

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setAssigneeFilter('')
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6">
        <Link to="/projects" className="flex items-center text-sm font-medium text-slate-500 hover:text-primary mb-4 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              {isLoading ? (
                <Skeleton className="h-9 w-48" />
              ) : (
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {project?.name}
                </h1>
              )}
            </div>
            <p className="text-slate-500 text-base">
              {project?.description || 'Track and manage project tasks'}
            </p>
          </div>
          <Button className="rounded-full shadow-lg" onClick={() => openTaskDialog('todo')}>
            <Plus className="mr-2 h-5 w-5" /> Add Task
          </Button>
        </div>
      </div>

      {/* ---- Search + Filters bar ---- */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search tasks by title..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 h-9 rounded-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as TaskStatus | 'all')}
          className="h-9 px-3 rounded-full text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        {/* Assignee filter */}
        {assignees.length > 0 && (
          <select
            value={assigneeFilter}
            onChange={e => setAssigneeFilter(e.target.value)}
            className="h-9 px-3 rounded-full text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            <option value="">All Assignees</option>
            {assignees.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="rounded-full text-slate-500 gap-1 h-9">
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}

        {/* Active filter count badge */}
        {hasActiveFilters && (
          <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
            {[searchQuery, statusFilter !== 'all', assigneeFilter].filter(Boolean).length} filter(s) active
          </span>
        )}
      </div>

      {/* ---- Error State ---- */}
      {tasksError && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 mb-6">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">Failed to load tasks. Please refresh the page.</p>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-red-600"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['projects', id, 'tasks'] })}
          >
            Retry
          </Button>
        </div>
      )}

      {/* ---- Kanban Board ---- */}
      {/* Outer wrapper scrolls horizontally on mobile */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-5 pb-4 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3">
          {STATUS_COLUMNS.map((column) => {
            const columnTasks = getFilteredTasks(column.id)

            return (
              <div
                key={column.id}
                className="flex flex-col bg-slate-100/50 dark:bg-slate-900/30 rounded-2xl p-4 flex-shrink-0 w-[300px] md:w-auto"
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-xs">
                      {column.label}
                    </h3>
                    <span className="ml-1 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-500">
                      {columnTasks.length}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <MoreVertical className="h-4 w-4 text-slate-400" />
                  </Button>
                </div>

                {/* Scrollable task list — fixed height, grows no further */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 space-y-3 overflow-y-auto min-h-[120px] max-h-[calc(100vh-400px)] transition-colors rounded-xl p-1 ${
                        snapshot.isDraggingOver ? 'bg-slate-200/50 dark:bg-slate-800/50' : ''
                      }`}
                    >
                      {isLoading ? (
                        [1, 2].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
                      ) : (
                        columnTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  opacity: snapshot.isDragging ? 0.8 : 1,
                                }}
                              >
                                <TaskCard
                                  task={task}
                                  onEdit={() => openTaskDialog(task.status, task)}
                                  onDelete={() => deleteTask.mutate(task.id)}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}

                      {!isLoading && columnTasks.length === 0 && (
                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 flex items-center justify-center opacity-50 min-h-[100px]">
                          <p className="text-sm text-slate-400 font-medium italic text-center">
                            {hasActiveFilters ? 'No tasks match filters' : 'Drop tasks here'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>

                {/* Add task button — always visible at bottom of column */}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded-xl mt-3 border border-transparent hover:border-slate-100 transition-all font-medium"
                  onClick={() => openTaskDialog(column.id)}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add task
                </Button>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      {id && (
        <TaskFormDialog
          open={isTaskDialogOpen}
          onOpenChange={(isOpen) => {
            setIsTaskDialogOpen(isOpen)
            if (!isOpen) setEditingTask(null)
          }}
          projectId={id}
          task={editingTask}
          defaultStatus={defaultStatus}
        />
      )}
    </AppLayout>
  )
}
