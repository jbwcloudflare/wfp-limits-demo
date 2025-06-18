import { ApolloClient, DocumentNode } from "@apollo/client/core";
import {
  KvActiveNamespacesQuery,
  KvOperationsByCursorQuery,
  KvOperationsByCursorQueryVariables,
  KvStorageByCursorQuery,
} from "./generated";
import {
  kvActiveNamespacesQuery,
  kvOperationsByCursorQuery,
  kvStorageByCursorQuery,
} from "./queries/kv.queries";
import { paginateQuery } from "./shared";

export async function paginateKvActiveNamespaces(
  client: ApolloClient<any>,
  accountTag: string,
  startDate: string,
  endDate: string,
  batchProcessor: (data: KvActiveNamespacesQuery) => Promise<void> | void,
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
  batchProcessor: (data: KvOperationsByCursorQuery) => Promise<void> | void,
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
  batchProcessor: (data: KvStorageByCursorQuery) => Promise<void> | void,
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
