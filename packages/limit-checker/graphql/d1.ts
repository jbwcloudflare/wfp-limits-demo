import { ApolloClient, DocumentNode } from "@apollo/client/core";
import {
  D1ActiveDatabasesQuery,
  D1OperationsByCursorQuery,
  D1OperationsByCursorQueryVariables,
  D1OperationsByIdQuery,
  D1OperationsByIdQueryVariables,
  D1StorageByCursorQuery,
  D1StorageByIdQuery,
  D1StorageByIdQueryVariables,
} from "./generated";
import {
  d1ActiveDatabasesQuery,
  d1OperationsByCursorQuery,
  d1OperationsByIdsQuery,
  d1StorageByCursorQuery,
  d1StorageByIdsQuery,
} from "./queries/d1.queries";
import { paginateQuery } from "./shared";
import { error } from "../utils";

export async function fullScanD1(
  client: ApolloClient<any>,
  account: string,
  startDate: string,
  endDate: string,
  batchSize: number
) {
  await paginateD1Operations(
    client,
    account,
    startDate,
    endDate,
    async (data: D1OperationsByCursorQuery) => {
      const groups = data.viewer?.accounts.at(0) ?? error("missing groups");
      for (const group of groups.d1AnalyticsAdaptiveGroups) {
        console.log(
          `D1 operations ${group.dimensions?.databaseId}: ${JSON.stringify(
            group.sum
          )}`
        );
      }
      return groups.d1AnalyticsAdaptiveGroups.length;
    },
    batchSize
  );

  await paginateD1Storage(
    client,
    account,
    startDate,
    endDate,
    async (data: D1StorageByCursorQuery) => {
      const groups = data.viewer?.accounts.at(0) ?? error("missing groups");
      for (const group of groups.d1StorageAdaptiveGroups) {
        console.log(
          `D1 storage ${group.dimensions?.databaseId}: ${JSON.stringify(
            group.max
          )}`
        );
      }
      return groups.d1StorageAdaptiveGroups.length;
    },
    batchSize
  );
}

export async function activeOnlyD1(
  client: ApolloClient<any>,
  account: string,
  activeStartDate: string,
  activeEndDate: string,
  usageStartDate: string,
  usageEndDate: string,
  batchSize: number
) {
  await paginateD1ActiveDatabases(
    client,
    account,
    activeStartDate,
    activeEndDate,
    async (data: D1ActiveDatabasesQuery) => {
      // Extract databaseIds
      const groups = data.viewer?.accounts.at(0) ?? error("missing groups");
      const databaseIds = groups.d1AnalyticsAdaptiveGroups.map(
        (x) => x.dimensions?.databaseId ?? error("missing databaseId")
      );
      console.log(`Checking ${databaseIds.length} databases`);

      // Check operations for the active databases
      const operations = await client.query<
        D1OperationsByIdQuery,
        D1OperationsByIdQueryVariables
      >({
        query: d1OperationsByIdsQuery,
        variables: {
          accountTag: account,
          startDate: usageStartDate,
          endDate: usageEndDate,
          resourceIds: databaseIds,
        },
      });

      const operationsByDatabase =
        operations.data.viewer?.accounts.at(0) ?? error("missing groups");

      for (const group of operationsByDatabase.d1AnalyticsAdaptiveGroups) {
        console.log(
          `D1 operations ${group.dimensions?.databaseId}: ${JSON.stringify(
            group.sum
          )}`
        );
      }

      // Check storage for the active databases
      const storage = await client.query<
        D1StorageByIdQuery,
        D1StorageByIdQueryVariables
      >({
        query: d1StorageByIdsQuery,
        variables: {
          accountTag: account,
          startDate: usageStartDate,
          endDate: usageEndDate,
          resourceIds: databaseIds,
        },
      });

      const storageByDatabase =
        storage.data.viewer?.accounts.at(0) ?? error("missing groups");

      for (const group of storageByDatabase.d1StorageAdaptiveGroups) {
        console.log(
          `D1 storage ${group.dimensions?.databaseId}: ${JSON.stringify(
            group.max
          )}`
        );
      }

      return databaseIds.length;
    },
    batchSize
  );
}

export async function paginateD1ActiveDatabases(
  client: ApolloClient<any>,
  accountTag: string,
  startDate: string,
  endDate: string,
  batchProcessor: (data: D1ActiveDatabasesQuery) => Promise<number> | number,
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
  batchProcessor: (data: D1OperationsByCursorQuery) => Promise<number> | number,
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
  batchProcessor: (data: D1StorageByCursorQuery) => Promise<number> | number,
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
