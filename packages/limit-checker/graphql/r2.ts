import { z } from "zod";
import {
  BatchProcessor,
  createOperationsResponseSchema,
  createQuery,
  executeQuery,
  paginateQuery,
  UsageQueryParams,
} from "./shared";

const R2DimensionsSchema = z.object({
  bucketName: z.string(),
});

const R2OperationSumSchema = z.object({
  requests: z.number(),
  responseBytes: z.number(),
  responseObjectSize: z.number(),
});

const R2OperationSchema = z.object({
  dimensions: R2DimensionsSchema,
  sum: R2OperationSumSchema,
});

export const R2OperationsResponseSchema = createOperationsResponseSchema(
  R2OperationSchema,
  "r2OperationsAdaptiveGroups"
);

export type R2Operation = z.infer<typeof R2OperationSchema>;
export type R2OperationsResponse = z.infer<typeof R2OperationsResponseSchema>;

export const r2OperationsQuery = createQuery(
  "r2OperationsAdaptiveGroups",
  "bucketName",
  "sum",
  ["requests", "responseBytes", "responseObjectSize"],
  ["bucketName"]
);

async function getR2Operations(
  params: UsageQueryParams
): Promise<R2Operation[]> {
  return executeQuery({
    endpoint: params.graphqlEndpoint,
    apiToken: params.apiToken,
    query: r2OperationsQuery,
    variables: {
      accountTag: params.accountTag,
      startDate: params.startDate,
      endDate: params.endDate,
      limit: params.limit,
      cursor: params.cursor,
    },
    validator: (input) => R2OperationsResponseSchema.parse(input),
    fieldName: "r2OperationsAdaptiveGroups",
  });
}

export async function paginateR2Operations(
  processor: BatchProcessor<R2Operation>,
  params: UsageQueryParams
): Promise<void> {
  const getCursor = (operation: R2Operation) => operation.dimensions.bucketName;
  return paginateQuery(
    "r2Operations",
    getR2Operations,
    getCursor,
    processor,
    params
  );
}

const R2StorageMaxSchema = z.object({
  objectCount: z.number(),
  uploadCount: z.number(),
  payloadSize: z.number(),
  metadataSize: z.number(),
});

const R2StorageSchema = z.object({
  dimensions: R2DimensionsSchema,
  max: R2StorageMaxSchema,
});

export const R2StorageResponseSchema = createOperationsResponseSchema(
  R2StorageSchema,
  "r2StorageAdaptiveGroups"
);

export type R2Storage = z.infer<typeof R2StorageSchema>;
export type R2StorageResponse = z.infer<typeof R2StorageResponseSchema>;

export const r2StorageQuery = createQuery(
  "r2StorageAdaptiveGroups",
  "bucketName",
  "max",
  ["objectCount", "uploadCount", "payloadSize", "metadataSize"],
  ["bucketName"]
);

async function getR2Storage(params: UsageQueryParams): Promise<R2Storage[]> {
  return executeQuery({
    endpoint: params.graphqlEndpoint,
    apiToken: params.apiToken,
    query: r2StorageQuery,
    variables: {
      accountTag: params.accountTag,
      startDate: params.startDate,
      endDate: params.endDate,
      limit: params.limit,
      cursor: params.cursor,
    },
    validator: (input) => R2StorageResponseSchema.parse(input),
    fieldName: "r2StorageAdaptiveGroups",
  });
}

export async function paginateR2Storage(
  processor: BatchProcessor<R2Storage>,
  params: UsageQueryParams
): Promise<void> {
  const getCursor = (operation: R2Storage) => operation.dimensions.bucketName;
  return paginateQuery("r2Storage", getR2Storage, getCursor, processor, params);
}
