import { ApolloClient, DocumentNode } from "@apollo/client/core";
import {
  KvActiveNamespacesQuery,
  KvOperationsByCursorQuery,
  KvOperationsByCursorQueryVariables,
  KvOperationsByIdQuery,
  KvOperationsByIdQueryVariables,
  KvStorageByCursorQuery,
  KvStorageByIdQuery,
  KvStorageByIdQueryVariables,
} from "./generated";
import {
  kvActiveNamespacesQuery,
  kvOperationsByCursorQuery,
  kvOperationsByIdsQuery,
  kvStorageByCursorQuery,
  kvStorageByIdsQuery,
} from "./queries/kv.queries";
import { paginateQuery } from "./shared";
import { error } from "../utils";

/**
 * Do a full scan over all KV namespaces, for both the Operation and Storage dataset
 */
export async function fullScanKv(
  client: ApolloClient<any>,
  account: string,
  startDate: string,
  endDate: string,
  batchSize: number
) {
  await paginateKvOperations(
    client,
    account,
    startDate,
    endDate,
    async (data: KvOperationsByCursorQuery) => {
      const groups = data.viewer?.accounts.at(0) ?? error("missing groups");
      for (const group of groups.kvOperationsAdaptiveGroups) {
        console.log(
          `KV operations ${group.dimensions?.namespaceId}: ${JSON.stringify(
            group.sum
          )}`
        );
      }
      return groups.kvOperationsAdaptiveGroups.length;
    },
    batchSize
  );
  await paginateKvStorage(
    client,
    account,
    startDate,
    endDate,
    async (data: KvStorageByCursorQuery) => {
      const groups = data.viewer?.accounts.at(0) ?? error("missing groups");
      for (const group of groups.kvStorageAdaptiveGroups) {
        console.log(
          `KV storage ${group.dimensions?.namespaceId}: ${JSON.stringify(
            group.max
          )}`
        );
      }
      return groups.kvStorageAdaptiveGroups.length;
    },
    batchSize
  );
}

/**
 * First search for active namespaces and then compute their full usage between startDate and endDate
 */
export async function activeOnlyKv(
  client: ApolloClient<any>,
  account: string,
  activeStartDate: string,
  activeEndDate: string,
  usageStartDate: string,
  usageEndDate: string,
  batchSize: number
) {
  await paginateKvActiveNamespaces(
    client,
    account,
    activeStartDate,
    activeEndDate,
    async (data: KvActiveNamespacesQuery) => {
      // Extract namespaceIds
      const groups = data.viewer?.accounts.at(0) ?? error("missing groups");
      const namespaceIds = groups.kvOperationsAdaptiveGroups.map(
        (x) => x.dimensions?.namespaceId ?? error("missing namespaceId")
      );
      console.log(`Checking ${namespaceIds.length} namespaces`);

      // Check operations for the active namespaces
      const operations = await client.query<
        KvOperationsByIdQuery,
        KvOperationsByIdQueryVariables
      >({
        query: kvOperationsByIdsQuery,
        variables: {
          accountTag: account,
          startDate: usageStartDate,
          endDate: usageEndDate,
          resourceIds: namespaceIds,
        },
      });

      const operationsByNamespace =
        operations.data.viewer?.accounts.at(0) ?? error("missing groups");

      for (const group of operationsByNamespace.kvOperationsAdaptiveGroups) {
        console.log(
          `KV operations ${group.dimensions?.namespaceId}: ${JSON.stringify(
            group.sum
          )}`
        );
      }

      // Check storage for the active namespaces
      const storage = await client.query<
        KvStorageByIdQuery,
        KvStorageByIdQueryVariables
      >({
        query: kvStorageByIdsQuery,
        variables: {
          accountTag: account,
          startDate: usageStartDate,
          endDate: usageEndDate,
          resourceIds: namespaceIds,
        },
      });

      const storageByNamespace =
        storage.data.viewer?.accounts.at(0) ?? error("missing groups");

      for (const group of storageByNamespace.kvStorageAdaptiveGroups) {
        console.log(
          `KV storage ${group.dimensions?.namespaceId}: ${JSON.stringify(
            group.max
          )}`
        );
      }
      return namespaceIds.length;
    },
    batchSize
  );
}

export async function paginateKvActiveNamespaces(
  client: ApolloClient<any>,
  accountTag: string,
  startDate: string,
  endDate: string,
  batchProcessor: (data: KvActiveNamespacesQuery) => Promise<number> | number,
  batchSize: number
) {
  await paginateQuery({
    client,
    query: kvActiveNamespacesQuery,
    variables: {
      accountTag,
      startDate,
      endDate,
    },
    batchProcessor,
    getCursor: (data: KvActiveNamespacesQuery) =>
      data.viewer?.accounts[0].kvOperationsAdaptiveGroups.at(-1)?.dimensions
        ?.namespaceId ?? null,
    batchSize,
  });
}

export async function paginateKvOperations(
  client: ApolloClient<any>,
  accountTag: string,
  startDate: string,
  endDate: string,
  batchProcessor: (data: KvOperationsByCursorQuery) => Promise<number> | number,
  batchSize: number
) {
  await paginateQuery({
    client,
    query: kvOperationsByCursorQuery,
    variables: {
      accountTag,
      startDate,
      endDate,
    },
    batchProcessor,
    getCursor: (data: KvOperationsByCursorQuery) =>
      data.viewer?.accounts[0].kvOperationsAdaptiveGroups.at(-1)?.dimensions
        ?.namespaceId ?? null,
    batchSize,
  });
}

export async function paginateKvStorage(
  client: ApolloClient<any>,
  accountTag: string,
  startDate: string,
  endDate: string,
  batchProcessor: (data: KvStorageByCursorQuery) => Promise<number> | number,
  batchSize: number
) {
  await paginateQuery({
    client,
    query: kvStorageByCursorQuery,
    variables: {
      accountTag,
      startDate,
      endDate,
    },
    batchProcessor,
    getCursor: (data: KvStorageByCursorQuery) =>
      data.viewer?.accounts[0].kvStorageAdaptiveGroups.at(-1)?.dimensions
        ?.namespaceId || null,
    batchSize,
  });
}
