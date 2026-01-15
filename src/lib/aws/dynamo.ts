import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ 
  region: process.env.AWS_REGION || 'us-east-1',
  // Allow local DynamoDB/LocalStack via AWS_ENDPOINT
  endpoint: process.env.AWS_ENDPOINT || undefined,
});

export const ddbDocClient = DynamoDBDocumentClient.from(client);

export const BOT_FAMILIES_TABLE = process.env.DYNAMODB_BOT_FAMILIES_TABLE!;
export const BOT_INSTANCES_TABLE = process.env.DYNAMODB_BOT_INSTANCES_TABLE!;
export const YOUTUBE_RUNS_TABLE = process.env.DYNAMODB_YOUTUBE_RUNS_TABLE!;
export const YOUTUBE_BOTS_TABLE = process.env.DYNAMODB_YOUTUBE_BOTS_TABLE!;
