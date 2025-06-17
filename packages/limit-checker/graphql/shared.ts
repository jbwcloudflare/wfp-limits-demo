import { z } from "zod";

// Shared base schemas
export const BaseErrorSchema = z.object({
  message: z.string(),
  path: z.array(z.string()).nullable(),
});

export const BaseResponseSchema = z.object({
  errors: z.array(BaseErrorSchema).nullable(),
});

export type TransformedResponse<T> =
  | {
      success: true;
      data: { viewer: { accounts: Array<{ [K: string]: T[] }> } };
    }
  | {
      success: false;
      errors: Array<{ message: string; path: string[] | null }>;
    };

// Generic response schema factory
export function createOperationsResponseSchema<T extends z.ZodTypeAny>(
  operationSchema: T,
  fieldName: string
) {
  return BaseResponseSchema.extend({
    data: z
      .object({
        viewer: z.object({
          accounts: z.array(
            z.object({
              [fieldName]: z.array(operationSchema),
            })
          ),
        }),
      })
      .nullable(),
  })
    .refine(
      (obj) => {
        return (obj.data !== null) !== (obj.errors !== null);
      },
      {
        message: "Exactly one of 'data' or 'errors' must be non-null",
      }
    )
    .transform((obj) => {
      if (obj.data !== null) {
        return { success: true as const, data: obj.data };
      } else {
        return { success: false as const, errors: obj.errors! };
      }
    });
}

async function executeGraphQLQuery(args: {
  endpoint: string;
  apiToken: string;
  query: string;
  variables: Record<string, any>;
}): Promise<unknown> {
  const { endpoint, apiToken, query, variables } = args;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.json();
}

// Generic query executor with schema validation
export async function executeQuery<T>(args: {
  endpoint: string;
  query: string;
  apiToken: string;
  variables: Record<string, any>;
  validator: (input: unknown) => TransformedResponse<T>;
  fieldName: string;
}): Promise<any[]> {
  const rawData = await executeGraphQLQuery(args);
  const parsedResponse = args.validator(rawData);

  if (!parsedResponse.success) {
    throw new Error(
      `Response Errors: ${parsedResponse.errors
        .map((e) => e.message)
        .join(", ")}`
    );
  }

  const accounts = parsedResponse.data.viewer.accounts;
  if (accounts.length === 0) {
    throw new Error("No accounts found in response");
  }

  return accounts[0][args.fieldName];
}

// Query template factory
export function createQuery(
  datasetName: string,
  cursorField: string,
  aggregateType: "sum" | "max",
  aggregateFields: string[],
  dimensionFields: string[]
): string {
  const aggregateFieldsStr = aggregateFields
    .map((field) => `          ${field}`)
    .join("\n");
  const dimensionFieldsStr = dimensionFields
    .map((field) => `          ${field}`)
    .join("\n");

  return `
query UsageBatchWithCursor(
  $accountTag: String!
  $startDate: Date!
  $endDate: Date!
  $cursor: String!
  $limit: Int!
) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      ${datasetName}(
        filter: {
          date_geq: $startDate
          date_leq: $endDate
          ${cursorField}_gt: $cursor
        }
        limit: $limit
        orderBy: [${cursorField}_ASC]
      ) {
        ${aggregateType} {
${aggregateFieldsStr}
        }
        dimensions {
${dimensionFieldsStr}
        }
      }
    }
  }
}`;
}

export interface BatchResult<T> {
  data: T[];
  nextCursor: string | null;
  batchNumber: number;
  isLastBatch: boolean;
}

export type BatchProcessor<T> = (batch: BatchResult<T>) => Promise<void> | void;

export interface UsageQueryParams {
  graphqlEndpoint: string;
  accountTag: string;
  apiToken: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  cursor?: string;
}

// Generic pagination function
export async function paginateQuery<T>(
  queryName: string,
  queryExecutor: (params: UsageQueryParams) => Promise<T[]>,
  getCursor: (item: T) => string,
  processor: BatchProcessor<T>,
  initialParams: UsageQueryParams,
  maxBatches: number = Infinity
): Promise<void> {
  let batchNumber = 0;
  let hasMore = true;
  const batchSize = initialParams.limit ?? 1000;

  const params = initialParams;
  while (hasMore && batchNumber < maxBatches) {
    try {
      const data = await queryExecutor(params);
      batchNumber++;

      // Determine next cursor and if this is the last batch
      let nextCursor: string | null = null;
      const isLastBatch = data.length < batchSize;

      if (!isLastBatch && data.length > 0) {
        nextCursor = getCursor(data[data.length - 1]);
      }

      // Process the batch
      const batchResult: BatchResult<T> = {
        data,
        nextCursor,
        batchNumber,
        isLastBatch,
      };

      if (data.length > 0) {
        await processor(batchResult);
      }

      // Update cursor for next iteration
      if (isLastBatch || data.length === 0) {
        hasMore = false;
      } else {
        params.cursor = nextCursor!;
      }

      // Log progress
      console.log(
        `[${queryName}] Processed batch ${batchNumber}: ${
          data.length
        } items, cursor: ${params.cursor || "END"}`
      );
    } catch (error) {
      console.error(
        `[${queryName}] Error processing batch ${batchNumber + 1}:`,
        error
      );
      throw error;
    }
  }
}
