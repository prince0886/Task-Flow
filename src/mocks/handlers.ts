import { http, HttpResponse } from 'msw'
import { LoginInput, RegisterInput, AuthResponse, Project, Task, CreateProjectInput, CreateTaskInput } from '@/types'

const loadData = (key: string, fallback: any) => {
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : fallback
}

const saveData = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data))
}

let users: any[] = loadData('mock_users', [
  { id: '1', name: 'John Doe', email: 'john@example.com', password: 'password123', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' }
])

let projects: Project[] = loadData('mock_projects', [
  { id: '1', name: 'Personal Website', description: 'Redesigning my portfolio', color: '#3b82f6', ownerId: '1', createdAt: new Date().toISOString() },
  { id: '2', name: 'Mobile App', description: 'React Native project', color: '#10b981', ownerId: '1', createdAt: new Date().toISOString() }
])

let tasks: Task[] = loadData('mock_tasks', [
  { id: 't1', title: 'Setup project', description: 'Initialize vite and tailwind', status: 'done', priority: 'high', projectId: '1', createdAt: new Date().toISOString() },
  { id: 't2', title: 'Design Homepage', description: 'Create figma designs', status: 'in_progress', priority: 'medium', projectId: '1', createdAt: new Date().toISOString() },
  { id: 't3', title: 'Market Research', description: 'Analyze competitors', status: 'todo', priority: 'low', projectId: '2', createdAt: new Date().toISOString() }
])

export const handlers = [
  // Auth
  http.post('/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as LoginInput
    const user = users.find(u => u.email === email && u.password === password)
    
    if (!user) {
      return new HttpResponse(null, { status: 401, statusText: 'Invalid credentials' })
    }

    const response: AuthResponse = {
      token: 'mock-jwt-token',
      user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }
    }
    return HttpResponse.json(response)
  }),

  http.post('/auth/register', async ({ request }) => {
    const { name, email, password } = await request.json() as RegisterInput
    if (users.some(u => u.email === email)) {
      return new HttpResponse(null, { status: 400, statusText: 'User already exists' })
    }
    const newUser = { id: Math.random().toString(36).substr(2, 9), name, email, password, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}` }
    users.push(newUser)
    saveData('mock_users', users)
    
    const response: AuthResponse = {
      token: 'mock-jwt-token',
      user: { id: newUser.id, name: newUser.name, email: newUser.email, avatarUrl: newUser.avatarUrl }
    }
    return HttpResponse.json(response)
  }),

  // Projects
  http.get('/projects', () => {
    const projectsWithCount = projects.map(p => ({
      ...p,
      taskCount: tasks.filter(t => t.projectId === p.id).length
    }))
    return HttpResponse.json(projectsWithCount)
  }),

  http.post('/projects', async ({ request }) => {
    const body = await request.json() as CreateProjectInput
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: body.name,
      description: body.description,
      color: body.color || '#3b82f6',
      ownerId: '1',
      createdAt: new Date().toISOString()
    }
    projects.push(newProject)
    saveData('mock_projects', projects)
    return HttpResponse.json(newProject)
  }),

  http.get('/projects/:id', ({ params }) => {
    const project = projects.find(p => p.id === params.id)
    if (!project) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(project)
  }),

  // Tasks
  http.get('/projects/:id/tasks', ({ params }) => {
    const projectTasks = tasks.filter(t => t.projectId === params.id)
    return HttpResponse.json(projectTasks)
  }),

  http.post('/projects/:id/tasks', async ({ request, params }) => {
    const body = await request.json() as CreateTaskInput
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      projectId: params.id as string,
      ...body,
      createdAt: new Date().toISOString()
    }
    tasks.push(newTask)
    saveData('mock_tasks', tasks)
    return HttpResponse.json(newTask)
  }),

  // Support both PATCH and PUT for task updates
  http.put('/tasks/:id', async ({ request, params }) => {
    const body = await request.json() as Partial<Task>
    const index = tasks.findIndex(t => t.id === params.id)
    if (index === -1) return new HttpResponse(null, { status: 404 })
    tasks[index] = { ...tasks[index], ...body }
    saveData('mock_tasks', tasks)
    return HttpResponse.json(tasks[index])
  }),

  http.patch('/tasks/:id', async ({ request, params }) => {
    const body = await request.json() as Partial<Task>
    const index = tasks.findIndex(t => t.id === params.id)
    if (index === -1) return new HttpResponse(null, { status: 404 })
    tasks[index] = { ...tasks[index], ...body }
    saveData('mock_tasks', tasks)
    return HttpResponse.json(tasks[index])
  }),

  http.delete('/tasks/:id', ({ params }) => {
    const initialLength = tasks.length
    tasks = tasks.filter(t => t.id !== params.id)
    if (tasks.length === initialLength) return new HttpResponse(null, { status: 404 })
    
    saveData('mock_tasks', tasks)
    return new HttpResponse(null, { status: 200 })
  }),

  http.delete('/projects/:id', ({ params }) => {
    const initialLength = projects.length
    projects = projects.filter(p => p.id !== params.id)
    if (projects.length === initialLength) return new HttpResponse(null, { status: 404 })
    
    tasks = tasks.filter(t => t.projectId !== params.id)
    saveData('mock_projects', projects)
    saveData('mock_tasks', tasks)
    return new HttpResponse(null, { status: 200 })
  })
]
