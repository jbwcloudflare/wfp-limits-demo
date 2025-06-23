import { ApolloClient, DocumentNode } from "@apollo/client/core";
import {
  R2ActiveBucketsQuery,
  R2OperationsByCursorQuery,
  R2OperationsByCursorQueryVariables,
  R2OperationsByIdQuery,
  R2OperationsByIdQueryVariables,
  R2StorageByCursorQuery,
  R2StorageByIdQuery,
  R2StorageByIdQueryVariables,
} from "./generated";
import {
  r2ActiveBucketsQuery,
  r2OperationsByCursorQuery,
  r2OperationsByIdsQuery,
  r2StorageByCursorQuery,
  r2StorageByIdsQuery,
} from "./queries/r2.queries";
import { paginateQuery } from "./shared";
import { error } from "../utils";

export async function fullScanR2(
  client: ApolloClient<any>,
  account: string,
  startDate: string,
  endDate: string,
  batchSize: number
) {
  await paginateR2Operations(
    client,
    account,
    startDate,
    endDate,
    async (data: R2OperationsByCursorQuery) => {
      const groups = data.viewer?.accounts.at(0) ?? error("missing groups");
      for (const group of groups.r2OperationsAdaptiveGroups) {
        console.log(
          `R2 operations ${group.dimensions?.bucketName}: ${JSON.stringify(
            group.sum
          )}`
        );
      }
      return groups.r2OperationsAdaptiveGroups.length;
    },
    batchSize
  );

  await paginateR2Storage(
    client,
    account,
    startDate,
    endDate,
    async (data: R2StorageByCursorQuery) => {
      const groups = data.viewer?.accounts.at(0) ?? error("missing groups");
      for (const group of groups.r2StorageAdaptiveGroups) {
        console.log(
          `R2 storage ${group.dimensions?.bucketName}: ${JSON.stringify(
            group.max
          )}`
        );
      }
      return groups.r2StorageAdaptiveGroups.length;
    },
    batchSize
  );
}

export async function activeOnlyR2(
  client: ApolloClient<any>,
  account: string,
  activeStartDate: string,
  activeEndDate: string,
  usageStartDate: string,
  usageEndDate: string,
  batchSize: number
) {
  await paginateR2ActiveBuckets(
    client,
    account,
    activeStartDate,
    activeEndDate,
    async (data: R2ActiveBucketsQuery) => {
      // Extract bucketNames
      const groups = data.viewer?.accounts.at(0) ?? error("missing groups");
      const bucketNames = groups.r2OperationsAdaptiveGroups.map(
        (x) => x.dimensions?.bucketName ?? error("missing bucketName")
      );
      console.log(`Checking ${bucketNames.length} buckets`);

      // Check operations for the active buckets
      const operations = await client.query<
        R2OperationsByIdQuery,
        R2OperationsByIdQueryVariables
      >({
        query: r2OperationsByIdsQuery,
        variables: {
          accountTag: account,
          startDate: usageStartDate,
          endDate: usageEndDate,
          resourceIds: bucketNames,
        },
      });

      const operationsByBucket =
        operations.data.viewer?.accounts.at(0) ?? error("missing groups");

      for (const group of operationsByBucket.r2OperationsAdaptiveGroups) {
        console.log(
          `R2 operations ${group.dimensions?.bucketName}: ${JSON.stringify(
            group.sum
          )}`
        );
      }

      // Check storage for the active buckets
      const storage = await client.query<
        R2StorageByIdQuery,
        R2StorageByIdQueryVariables
      >({
        query: r2StorageByIdsQuery,
        variables: {
          accountTag: account,
          startDate: usageStartDate,
          endDate: usageEndDate,
          resourceIds: bucketNames,
        },
      });

      const storageByBucket =
        storage.data.viewer?.accounts.at(0) ?? error("missing groups");

      for (const group of storageByBucket.r2StorageAdaptiveGroups) {
        console.log(
          `R2 storage ${group.dimensions?.bucketName}: ${JSON.stringify(
            group.max
          )}`
        );
      }

      return bucketNames.length;
    },
    batchSize
  );
}

export async function paginateR2ActiveBuckets(
  client: ApolloClient<any>,
  accountTag: string,
  startDate: string,
  endDate: string,
  batchProcessor: (data: R2ActiveBucketsQuery) => Promise<number> | number,
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
  batchProcessor: (data: R2OperationsByCursorQuery) => Promise<number> | number,
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
  batchProcessor: (data: R2StorageByCursorQuery) => Promise<number> | number,
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
