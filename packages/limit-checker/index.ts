import { env } from "node:process";
import { error } from "./utils";
import {
  paginateD1ActiveDatabases,
  paginateD1Operations,
  paginateD1Storage,
} from "./graphql/d1";
import {
  D1ActiveDatabasesQuery,
  D1OperationsByCursorQuery,
  D1OperationsByIdQuery,
  D1OperationsByIdQueryVariables,
  D1StorageByCursorQuery,
  D1StorageByIdQuery,
  D1StorageByIdQueryVariables,
  KvActiveNamespacesQuery,
  KvOperationsByCursorQuery,
  KvOperationsByIdQuery,
  KvOperationsByIdQueryVariables,
  KvStorageByCursorQuery,
  KvStorageByIdQuery,
  KvStorageByIdQueryVariables,
  R2ActiveBucketsQuery,
  R2OperationsByCursorQuery,
  R2OperationsByIdQuery,
  R2OperationsByIdQueryVariables,
  R2StorageByCursorQuery,
  R2StorageByIdQuery,
  R2StorageByIdQueryVariables,
} from "./graphql/generated";
import { getApolloClient } from "./graphql/client";
import {
  activeOnlyKv,
  fullScanKv,
  paginateKvActiveNamespaces,
  paginateKvOperations,
  paginateKvStorage,
} from "./graphql/kv";
import {
  kvOperationsByIdsQuery,
  kvStorageByIdsQuery,
} from "./graphql/queries/kv.queries";
import {
  paginateR2ActiveBuckets,
  paginateR2Operations,
  paginateR2Storage,
} from "./graphql/r2";
import {
  r2OperationsByIdsQuery,
  r2StorageByIdsQuery,
} from "./graphql/queries/r2.queries";
import {
  d1OperationsByIdsQuery,
  d1StorageByIdsQuery,
} from "./graphql/queries/d1.queries";
import { ms } from "itty-time";

const account = env.CLOUDFLARE_ACCOUNT ?? error("missing CLOUDFLARE_ACCOUNT");

const activeStartDate = new Date(Date.now() - ms("30 minutes")).toISOString();
const activeEndDate = new Date().toISOString();
const usageStartDate = new Date(Date.now() - ms("3 days")).toISOString();
const usageEndDate = new Date().toISOString();
const batchSize = 3;

const client = getApolloClient();

async function fullScan() {
  await fullScanKv(client, account, usageStartDate, usageEndDate, batchSize);

  // R2
  await paginateR2Operations(
    client,
    account,
    usageStartDate,
    usageEndDate,
    async (data: R2OperationsByCursorQuery) => {
      const groups = data.viewer?.accounts.at(0) ?? error("missing groups");
      for (const group of groups.r2OperationsAdaptiveGroups) {
        console.log(
          `R2 operations ${group.dimensions?.bucketName}: ${JSON.stringify(
            group.sum
          )}`
        );
      }
    },
    batchSize
  );

  await paginateR2Storage(
    client,
    account,
    usageStartDate,
    usageEndDate,
    async (data: R2StorageByCursorQuery) => {
      const groups = data.viewer?.accounts.at(0) ?? error("missing groups");
      for (const group of groups.r2StorageAdaptiveGroups) {
        console.log(
          `R2 storage ${group.dimensions?.bucketName}: ${JSON.stringify(
            group.max
          )}`
        );
      }
    },
    batchSize
  );

  // D1
  await paginateD1Operations(
    client,
    account,
    usageStartDate,
    usageEndDate,
    async (data: D1OperationsByCursorQuery) => {
      const groups = data.viewer?.accounts.at(0) ?? error("missing groups");
      for (const group of groups.d1AnalyticsAdaptiveGroups) {
        console.log(
          `D1 operations ${group.dimensions?.databaseId}: ${JSON.stringify(
            group.sum
          )}`
        );
      }
    },
    batchSize
  );

  await paginateD1Storage(
    client,
    account,
    usageStartDate,
    usageEndDate,
    async (data: D1StorageByCursorQuery) => {
      const groups = data.viewer?.accounts.at(0) ?? error("missing groups");
      for (const group of groups.d1StorageAdaptiveGroups) {
        console.log(
          `D1 storage ${group.dimensions?.databaseId}: ${JSON.stringify(
            group.max
          )}`
        );
      }
    },
    batchSize
  );
}

async function activeOnly() {
  await activeOnlyKv(
    client,
    account,
    activeStartDate,
    activeEndDate,
    usageStartDate,
    usageEndDate,
    batchSize
  );

  // R2
  await paginateR2ActiveBuckets(
    client,
    account,
    usageStartDate,
    usageEndDate,
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
    },
    batchSize
  );

  // D1
  await paginateD1ActiveDatabases(
    client,
    account,
    usageStartDate,
    usageEndDate,
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
    },
    batchSize
  );
}

await fullScan();
// await activeOnly();
