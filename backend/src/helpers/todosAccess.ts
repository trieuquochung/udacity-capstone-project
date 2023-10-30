import * as AWS from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { createLogger } from '../utils/logger';
import { TodoItem } from '../models/TodoItem';
import { TodoUpdate } from '../models/TodoUpdate';
const AWSXRay = require("aws-xray-sdk");
const XAWS = AWSXRay.captureAWS(AWS);

const logger = createLogger('TodosAccess');

// TODO: Implement the dataLayer logic
const SIGNED_URL_EXPIRATION = process.env.SIGNED_URL_EXPIRATION;
const ATTACHMENT_S3_BUCKET = process.env.ATTACHMENT_S3_BUCKET;

export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly todosIndex = process.env.TODOS_CREATED_AT_INDEX,
    private readonly S3 = new XAWS.S3({ signatureVersion: "v4" }),
    private readonly attachment_s3_bucket_name = ATTACHMENT_S3_BUCKET
  ) { }

  async getAllClient(userId: string): Promise<TodoItem[]> {
    const resuslt = await this.docClient.query({
      TableName: this.todosTable,
      IndexName: this.todosIndex,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": userId }
    }).promise();
    return resuslt.Items as TodoItem[];
  }

  async createClient(item: TodoItem): Promise<TodoItem> {
    await this.docClient.put({
      Item: item,
      TableName: this.todosTable
    }).promise();
    return item as TodoItem;
  }

  async updateClient(userId: string, todoId: string, todoUpdate: TodoUpdate): Promise<TodoItem> {
    logger.info(`Update todo ID: ${todoId} in the table: ${this.todosTable}`);
    try {
      await this.docClient.update({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId
        },
        UpdateExpression:
          "set #name = :name, #dueDate = :dueDate, #updatedAt = :updatedAt, #done = :done",
        ExpressionAttributeNames: {
          "#name": "name",
          "#dueDate": "dueDate",
          "#updatedAt": "updatedAt",
          "#done": "done"
        },
        ExpressionAttributeValues: {
          ":name": todoUpdate.name,
          ":dueDate": todoUpdate.dueDate,
          //":updatedAt": todoUpdate.updatedAt,
          ":updatedAt": new Date().toLocaleString(), //fix local timezone to server timezone 
          ":done": todoUpdate.done
        },
        ReturnValues: "UPDATED_NEW",
      }).promise();
    } catch (error) {
      logger.error(`ERROR: Update todo ID: ${todoId} was failed`, {
        error: error,
        data: {
          userId,
          todoId,
          todoUpdate,
        },
      });
      throw Error(error);
    }
    return todoUpdate as TodoItem;
  }

  async deleteClient(userId: string, todoId: string): Promise<String> {
    logger.info(`Delete todo ID: ${todoId} in the table ${this.todosTable}`);
    try {
      await this.docClient.delete({
        TableName: this.todosTable,
        Key: {
          todoId,
          userId
        }
      }).promise();
      return `Delete todo ID: ${todoId} in the table ${this.todosTable} successfully`;
    } catch (error) {
      logger.info(`ERROR: Delete todo ID: ${todoId} was failed`, {
        error: error,
        data: {
          userId,
          todoId
        }
      });
      return `ERROR: Delete todo ID: ${todoId} in the table ${this.todosTable} was failed`;
    }
  }

  async getUploadUrl(todoId: string, userId: string): Promise<string> {
    const uploadUrl = this.S3.getSignedUrl("putObject", {
      Bucket: this.attachment_s3_bucket_name,
      Key: todoId,
      Expires: Number(SIGNED_URL_EXPIRATION),
    });
    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        userId,
        todoId
      },
      UpdateExpression: "set attachmentUrl = :URL, #updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":URL": uploadUrl.split("?")[0],
        ":updatedAt": new Date().toLocaleString()
      },
      ReturnValues: "UPDATED_NEW"
    }).promise();
    return uploadUrl;
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    return new XAWS.DynamoDB.DocumentClient({
      region: "localhost",
      endpoint: "http://localhost:8000",
    });
  }

  return new XAWS.DynamoDB.DocumentClient();
}