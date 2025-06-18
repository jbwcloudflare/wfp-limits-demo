import { ApolloClient, DocumentNode } from "@apollo/client/core";
import {
  R2ActiveBucketsQuery,
  R2OperationsByCursorQuery,
  R2OperationsByCursorQueryVariables,
  R2StorageByCursorQuery,
} from "./generated";
import {
  r2ActiveBucketsQuery,
  r2OperationsByCursorQuery,
  r2StorageByCursorQuery,
} from "./queries/r2.queries";
import { paginateQuery } from "./shared";

export async function paginateR2ActiveBuckets(
  client: ApolloClient<any>,
  accountTag: string,
  startDate: string,
  endDate: string,
  batchProcessor: (data: R2ActiveBucketsQuery) => Promise<void> | void,
  batchSize: number
) {
  await paginateQuery({
    client,
    query: r2ActiveBucketsQuery,
    variables: {
      accountTag,
      startDate,
      endDate,
    },
    batchProcessor,
    getCursor: (data: R2ActiveBucketsQuery) =>
      data.viewer?.accounts[0].r2OperationsAdaptiveGroups.at(-1)?.dimensions
        ?.bucketName ?? null,
    batchSize,
  });
}

export async function paginateR2Operations(
  client: ApolloClient<any>,
  accountTag: string,
  startDate: string,
  endDate: string,
  batchProcessor: (data: R2OperationsByCursorQuery) => Promise<void> | void,
  batchSize: number
) {
  await paginateQuery({
    client,
    query: r2OperationsByCursorQuery,
    variables: {
      accountTag,
      startDate,
      endDate,
    },
    batchProcessor,
    getCursor: (data: R2OperationsByCursorQuery) =>
      data.viewer?.accounts[0].r2OperationsAdaptiveGroups.at(-1)?.dimensions
        ?.bucketName ?? null,
    batchSize,
  });
}

export async function paginateR2Storage(
  client: ApolloClient<any>,
  accountTag: string,
  startDate: string,
  endDate: string,
  batchProcessor: (data: R2StorageByCursorQuery) => Promise<void> | void,
  batchSize: number
) {
  await paginateQuery({
    client,
    query: r2StorageByCursorQuery,
    variables: {
      accountTag,
      startDate,
      endDate,
    },
    batchProcessor,
    getCursor: (data: R2StorageByCursorQuery) =>
      data.viewer?.accounts[0].r2StorageAdaptiveGroups.at(-1)?.dimensions
        ?.bucketName || null,
    batchSize,
  });
}
