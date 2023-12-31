/**
 * Fields in a request to update a single TODO item.
 */
export interface UpdateTodoRequest {
  name: string
  dueDate: string
  updatedAt: string
  done: boolean,
  priorityLevel: string
}