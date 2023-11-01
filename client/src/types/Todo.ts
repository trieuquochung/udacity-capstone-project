export interface Todo {
  todoId: string
  createdAt: string
  name: string
  dueDate: string
  done: boolean
  attachmentUrl?: string,
  updatedAt?: string,
  priorityLevel: string
}
