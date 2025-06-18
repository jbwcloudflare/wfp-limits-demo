import { ApolloClient, DocumentNode } from "@apollo/client/core";
import {
  D1ActiveDatabasesQuery,
  D1OperationsByCursorQuery,
  D1OperationsByCursorQueryVariables,
  D1StorageByCursorQuery,
} from "./generated";
import {
  d1ActiveDatabasesQuery,
  d1OperationsByCursorQuery,
  d1StorageByCursorQuery,
} from "./queries/d1.queries";
import { paginateQuery } from "./shared";

export async function paginateD1ActiveDatabases(
  client: ApolloClient<any>,
  accountTag: string,
  startDate: string,
  endDate: string,
  batchProcessor: (data: D1ActiveDatabasesQuery) => Promise<void> | void,
  batchSize: number
) {
  await paginateQuery({
    client,
    query: d1ActiveDatabasesQuery,
    variables: {
      accountTag,
      startDate,
      endDate,
    },
    batchProcessor,
    getCursor: (data: D1ActiveDatabasesQuery) =>
      data.viewer?.accounts[0].d1AnalyticsAdaptiveGroups.at(-1)?.dimensions
        ?.databaseId ?? null,
    batchSize,
  });
}

export async function paginateD1Operations(
  client: ApolloClient<any>,
  accountTag: string,
  startDate: string,
  endDate: string,
  batchProcessor: (data: D1OperationsByCursorQuery) => Promise<void> | void,
  batchSize: number
) {
  await paginateQuery({
    client,
    query: d1OperationsByCursorQuery,
    variables: {
      accountTag,
      startDate,
      endDate,
    },
    batchProcessor,
    getCursor: (data: D1OperationsByCursorQuery) =>
      data.viewer?.accounts[0].d1AnalyticsAdaptiveGroups.at(-1)?.dimensions
        ?.databaseId ?? null,
    batchSize,
  });
}

export async function paginateD1Storage(
  client: ApolloClient<any>,
  accountTag: string,
  startDate: string,
  endDate: string,
  batchProcessor: (data: D1StorageByCursorQuery) => Promise<void> | void,
  batchSize: number
) {
  await paginateQuery({
    client,
    query: d1StorageByCursorQuery,
    variables: {
      accountTag,
      startDate,
      endDate,
    },
    batchProcessor,
    getCursor: (data: D1StorageByCursorQuery) =>
      data.viewer?.accounts[0].d1StorageAdaptiveGroups.at(-1)?.dimensions
        ?.databaseId || null,
    batchSize,
  });
}
