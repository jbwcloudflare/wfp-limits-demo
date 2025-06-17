import { z } from "zod";
import {
  BatchProcessor,
  createOperationsResponseSchema,
  createQuery,
  executeQuery,
  paginateQuery,
  UsageQueryParams,
} from "./shared";

// D1 Operations (Analytics)
const D1DimensionsSchema = z.object({
  databaseId: z.string(),
});

const D1OperationSumSchema = z.object({
  queryBatchResponseBytes: z.number(),
  readQueries: z.number(),
  rowsRead: z.number(),
  rowsWritten: z.number(),
  writeQueries: z.number(),
});

const D1OperationSchema = z.object({
  dimensions: D1DimensionsSchema,
  sum: D1OperationSumSchema,
});

export const D1OperationsResponseSchema = createOperationsResponseSchema(
  D1OperationSchema,
  "d1AnalyticsAdaptiveGroups"
);

export type D1Operation = z.infer<typeof D1OperationSchema>;
export type D1OperationsResponse = z.infer<typeof D1OperationsResponseSchema>;

export const d1OperationsQuery = createQuery(
  "d1AnalyticsAdaptiveGroups",
  "databaseId",
  "sum",
  [
    "queryBatchResponseBytes",
    "readQueries",
    "rowsRead",
    "rowsWritten",
    "writeQueries",
  ],
  ["databaseId"]
);

async function getD1Operations(
  params: UsageQueryParams
): Promise<D1Operation[]> {
  return executeQuery({
    endpoint: params.graphqlEndpoint,
    apiToken: params.apiToken,
    query: d1OperationsQuery,
    variables: {
      accountTag: params.accountTag,
      startDate: params.startDate,
      endDate: params.endDate,
      limit: params.limit,
      cursor: params.cursor,
    },
    validator: (input) => D1OperationsResponseSchema.parse(input),
    fieldName: "d1AnalyticsAdaptiveGroups",
  });
}

export async function paginateD1Operations(
  processor: BatchProcessor<D1Operation>,
  params: UsageQueryParams
): Promise<void> {
  const getCursor = (operation: D1Operation) => operation.dimensions.databaseId;
  return paginateQuery(
    "d1Operations",
    getD1Operations,
    getCursor,
    processor,
    params
  );
}

// D1 Storage
const D1StorageMaxSchema = z.object({
  databaseSizeBytes: z.number(),
});

const D1StorageSchema = z.object({
  dimensions: D1DimensionsSchema,
  max: D1StorageMaxSchema,
});

export const D1StorageResponseSchema = createOperationsResponseSchema(
  D1StorageSchema,
  "d1StorageAdaptiveGroups"
);

export type D1Storage = z.infer<typeof D1StorageSchema>;
export type D1StorageResponse = z.infer<typeof D1StorageResponseSchema>;

export const d1StorageQuery = createQuery(
  "d1StorageAdaptiveGroups",
  "databaseId",
  "max",
  ["databaseSizeBytes"],
  ["databaseId"]
);

async function getD1Storage(params: UsageQueryParams): Promise<D1Storage[]> {
  return executeQuery({
    endpoint: params.graphqlEndpoint,
    apiToken: params.apiToken,
    query: d1StorageQuery,
    variables: {
      accountTag: params.accountTag,
      startDate: params.startDate,
      endDate: params.endDate,
      limit: params.limit,
      cursor: params.cursor,
    },
    validator: (input) => D1StorageResponseSchema.parse(input),
    fieldName: "d1StorageAdaptiveGroups",
  });
}

export async function paginateD1Storage(
  processor: BatchProcessor<D1Storage>,
  params: UsageQueryParams
): Promise<void> {
  const getCursor = (storage: D1Storage) => storage.dimensions.databaseId;
  return paginateQuery("d1Storage", getD1Storage, getCursor, processor, params);
}
