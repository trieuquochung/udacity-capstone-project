import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as middy from 'middy';
import { cors } from 'middy/middlewares';
import { getTodosByUserID } from '../../helpers/todos';
import { getUserId } from '../utils';;

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todosList = await getTodosByUserID(getUserId(event));
    return {
      statusCode: 200,
      body: JSON.stringify({ items: todosList }),
    };
  })

handler.use(
  cors({
    credentials: true
  })
)