import { KvOperation, KvOperationsResponseSchema } from "./schemas/kv";
import { env } from "node:process";

const graphqlEndpoint = "https://api.cloudflare.com/client/v4/graphql";
const accountTag = env.CLOUDFLARE_ACCOUNT;
const apiToken = env.CLOUDFLARE_API_TOKEN;

const today = new Date().toLocaleDateString("en-CA");

// Execute GraphQL query with Zod validation
async function executeQuery(
  query: string,
  variables: Record<string, any>
): Promise<KvOperation[]> {
  const response = await fetch(graphqlEndpoint, {
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

  const rawData: unknown = await response.json();
  const parsedResponse = KvOperationsResponseSchema.parse(rawData);
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
  return accounts[0].kvOperationsAdaptiveGroups;
}

const kvQuery = `
query KvUsageBatchWithCursor(
 $accountTag: String!
 $startDate: Date!
 $endDate: Date!
 $namespaceCursor: String!
 $limit: Int!
) {
 viewer {
   accounts(filter: { accountTag: $accountTag }) {
     kvOperationsAdaptiveGroups(
       filter: {
         date_geq: $startDate
         date_leq: $endDate
         namespaceId_gt: $namespaceCursor
       }
       limit: $limit
       orderBy: [namespaceId_ASC]
     ) {
       sum {
         requests
         objectBytes
       }
       dimensions {
         namespaceId
         actionType
       }
     }
   }
 }
}
`;

const result = await executeQuery(kvQuery, {
  accountTag: accountTag,
  startDate: today,
  endDate: today,
  limit: 1000,
  namespaceCursor: "",
});

console.log(`RESULT: ${JSON.stringify(result, undefined, 2)}`);
