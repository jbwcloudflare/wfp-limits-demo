import { ApolloClient, DocumentNode } from "@apollo/client/core";

export interface PaginationConfig<TData, TVariables> {
  client: ApolloClient<any>;
  query: DocumentNode;
  variables: TVariables;
  batchProcessor: (data: TData) => Promise<void> | void;
  getCursor: (data: TData) => string | null;
  batchSize: number;
}

export async function paginateQuery<
  TData,
  TVariables extends Record<string, string | number | undefined>
>({
  client,
  query,
  variables,
  batchProcessor,
  getCursor,
  batchSize,
}: PaginationConfig<TData, TVariables>): Promise<void> {
  let cursor = variables.cursor;
  let hasMore = true;

  while (hasMore) {
    const { data, errors } = await client.query<TData, TVariables>({
      query,
      variables: {
        ...variables,
        cursor,
        limit: batchSize,
      } as TVariables,
      fetchPolicy: "network-only", // Ensure fresh data for each page
    });

    if (errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(errors)}`);
    }

    if (!data) {
      throw new Error("No data returned from query");
    }

    // Process the current batch
    await batchProcessor(data);

    // Get the next cursor from the data
    const nextCursor = getCursor(data);

    // If no cursor or same cursor, we've reached the end
    if (!nextCursor || nextCursor === cursor) {
      hasMore = false;
    } else {
      cursor = nextCursor;
    }
  }
}
