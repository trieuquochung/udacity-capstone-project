export interface TodoItem {
  userId: string
  todoId: string
  createdAt: string
  name: string
  dueDate: string
  updatedAt?: string
  done: boolean
  attachmentUrl?: string,
  priorityLevel: string
}
