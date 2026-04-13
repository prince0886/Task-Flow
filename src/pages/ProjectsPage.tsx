import apiClient from '@/services/api'
import { Project } from '@/types'
import AppLayout from '@/components/AppLayout'
import { toast } from 'sonner'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Folder, Calendar, ChevronRight, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import ProjectFormDialog from '@/components/ProjectFormDialog'

export default function ProjectsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      await apiClient.delete(`/projects/${projectId}`)
    },
    onMutate: async (projectId) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] })
      const previousProjects = queryClient.getQueryData<Project[]>(['projects'])
      if (previousProjects) {
        queryClient.setQueryData<Project[]>(['projects'], old => 
          old?.filter(p => p.id !== projectId)
        )
      }
      return { previousProjects }
    },
    onSuccess: () => {
      toast.success("Project deleted")
    },
    onError: (_err, _id, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects)
      }
      toast.error("Failed to delete project")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiClient.get<Project[]>('/projects')
      return response.data
    },
  })

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Your Projects</h1>
          <p className="text-slate-500 mt-1">Manage and track your active workflows</p>
        </div>
        <Button size="lg" className="rounded-full shadow-lg transition-all hover:scale-105 w-full sm:w-auto" onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-5 w-5" /> New Project
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects?.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md rounded-2xl overflow-hidden h-full flex flex-col cursor-pointer bg-white dark:bg-slate-900 border-l-4" style={{ borderLeftColor: project.color }}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      <Folder className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={(e) => {
                          e.preventDefault()
                          deleteProject.mutate(project.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{project.name}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">{project.description || 'No description provided.'}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex items-center text-sm text-slate-500 mt-2">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50/50 dark:bg-slate-800/50 py-3 px-6 border-t dark:border-slate-800 flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {project.taskCount || 0} Tasks
                  </span>
                  <div className="flex -space-x-2">
                    {[1, 2].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
                    ))}
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
          
          {projects?.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                <Folder className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">No projects yet</h3>
              <p className="text-slate-500 mt-2 max-w-sm">Create your first project to start organizing your work and collaboration.</p>
              <Button variant="outline" className="mt-6" onClick={() => setIsDialogOpen(true)}>
                Create First Project
              </Button>
            </div>
          )}
        </div>
      )}
      <ProjectFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </AppLayout>
  )
}
