import { z } from "zod";
import {
  BatchProcessor,
  createOperationsResponseSchema,
  createQuery,
  executeQuery,
  paginateQuery,
  UsageQueryParams,
} from "./shared";

const KvDimensionsSchema = z.object({
  namespaceId: z.string(),
});

const KvOperationSumSchema = z.object({
  requests: z.number(),
  objectBytes: z.number(),
});

const KvOperationSchema = z.object({
  dimensions: KvDimensionsSchema,
  sum: KvOperationSumSchema,
});

export const KvOperationsResponseSchema = createOperationsResponseSchema(
  KvOperationSchema,
  "kvOperationsAdaptiveGroups"
);

export type KvOperation = z.infer<typeof KvOperationSchema>;
export type KvOperationsResponse = z.infer<typeof KvOperationsResponseSchema>;

export const kvOperationsQuery = createQuery(
  "kvOperationsAdaptiveGroups",
  "namespaceId",
  "sum",
  ["requests", "objectBytes"],
  ["namespaceId"]
);

async function getKvOperations(
  params: UsageQueryParams
): Promise<KvOperation[]> {
  return executeQuery({
    endpoint: params.graphqlEndpoint,
    apiToken: params.apiToken,
    query: kvOperationsQuery,
    variables: {
      accountTag: params.accountTag,
      startDate: params.startDate,
      endDate: params.endDate,
      limit: params.limit,
      cursor: params.cursor,
    },
    validator: (input) => KvOperationsResponseSchema.parse(input),
    fieldName: "kvOperationsAdaptiveGroups",
  });
}

export async function paginateKvOperations(
  processor: BatchProcessor<KvOperation>,
  params: UsageQueryParams
): Promise<void> {
  const getCursor = (operation: KvOperation) =>
    operation.dimensions.namespaceId;
  return paginateQuery(
    "kvOperations",
    getKvOperations,
    getCursor,
    processor,
    params
  );
}

const KvStorageMaxSchema = z.object({
  keyCount: z.number(),
  byteCount: z.number(),
});

const KvStorageSchema = z.object({
  dimensions: KvDimensionsSchema,
  max: KvStorageMaxSchema,
});

export const KvStorageResponseSchema = createOperationsResponseSchema(
  KvStorageSchema,
  "kvStorageAdaptiveGroups"
);

export type KvStorage = z.infer<typeof KvStorageSchema>;
export type KvStorageResponse = z.infer<typeof KvStorageResponseSchema>;

export const kvStorageQuery = createQuery(
  "kvStorageAdaptiveGroups",
  "namespaceId",
  "max",
  ["keyCount", "byteCount"],
  ["namespaceId"]
);

async function getKvStorage(params: UsageQueryParams): Promise<KvStorage[]> {
  return executeQuery({
    endpoint: params.graphqlEndpoint,
    apiToken: params.apiToken,
    query: kvStorageQuery,
    variables: {
      accountTag: params.accountTag,
      startDate: params.startDate,
      endDate: params.endDate,
      limit: params.limit,
      cursor: params.cursor,
    },
    validator: (input) => KvStorageResponseSchema.parse(input),
    fieldName: "kvStorageAdaptiveGroups",
  });
}

export async function paginateKvStorage(
  processor: BatchProcessor<KvStorage>,
  params: UsageQueryParams
): Promise<void> {
  const getCursor = (storage: KvStorage) => storage.dimensions.namespaceId;
  return paginateQuery("kvStorage", getKvStorage, getCursor, processor, params);
}
