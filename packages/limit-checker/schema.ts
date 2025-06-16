import { z } from "zod";

const KvOperationDimensionsSchema = z.object({
  namespaceId: z.string(),
  actionType: z.string(),
});

const KvOperationSumSchema = z.object({
  requests: z.number(),
  objectBytes: z.number(),
});

const KvOperationSchema = z.object({
  dimensions: KvOperationDimensionsSchema,
  sum: KvOperationSumSchema,
});

export const KvOperationsResponseSchema = z
  .object({
    data: z
      .object({
        viewer: z.object({
          accounts: z.array(
            z.object({
              kvOperationsAdaptiveGroups: z.array(KvOperationSchema),
            })
          ),
        }),
      })
      .nullable(),
    errors: z
      .array(
        z.object({
          message: z.string(),
          path: z.array(z.string()).nullable(),
        })
      )
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

// TypeScript types derived from Zod schemas
export type KvOperation = z.infer<typeof KvOperationSchema>;
export type KvOperationsResponse = z.infer<typeof KvOperationsResponseSchema>;
