import { TodosAccess } from "./todosAccess";
import { TodoItem } from "../models/TodoItem";
import { CreateTodoRequest } from "../requests/CreateTodoRequest";
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest";
import { createLogger } from "../utils/logger";
import * as uuid from "uuid";

const logger = createLogger("TodosAccess");
const todosAccess = new TodosAccess();

export async function createTodo(todoData: CreateTodoRequest, userId: string): Promise<TodoItem> {
  logger.info(`Trigger createTodo, userId: ${userId}`);
  return await todosAccess.createClient({
    createdAt: new Date().toISOString(),
    todoId: uuid.v4(),
    userId: userId,
    done: false,
    attachmentUrl: null,
    ...todoData,
  });
}

export async function getTodosByUserID(userId: string): Promise<TodoItem[]> {
  logger.info(`Trigger getTodosByUserID, userId: ${userId}`);
  return await todosAccess.getAllClient(userId);
}

export async function updateTodosByUserID(userId: string, todoId: string, updatedTodo: UpdateTodoRequest): Promise<TodoItem> {
  logger.info(`Trigger updateTodosByUserID, userId: ${userId}`);
  return await todosAccess.updateClient(userId, todoId, updatedTodo);
}

export async function deleteTodosByUserID(userId: string, todoId: string): Promise<String> {
  logger.info(`Trigger deleteTodosByUserID, , userId: ${userId}`);
  return await todosAccess.deleteClient(userId, todoId);
}

export async function createAttachmentPresignedUrl(userId: string, todoId: string): Promise<String> {
  logger.info(`Trigger createAttachmentPresignedUrl, userId: ${userId}`);
  return await todosAccess.getUploadUrl(todoId, userId);;
}