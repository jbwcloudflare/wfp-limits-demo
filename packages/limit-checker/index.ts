import { env } from "node:process";
import { throwError } from "./utils";
import { BatchResult, UsageQueryParams } from "./graphql/shared";
import {
  KvOperation,
  KvStorage,
  paginateKvOperations,
  paginateKvStorage,
} from "./graphql/kv";
import {
  paginateR2Operations,
  paginateR2Storage,
  R2Operation,
  R2Storage,
} from "./graphql/r2";
import {
  D1Operation,
  D1Storage,
  paginateD1Operations,
  paginateD1Storage,
} from "./graphql/d1";

const today = new Date().toLocaleDateString("en-CA");
console.log(`Date: ${today}`);

const graphqlEndpoint = "https://api.cloudflare.com/client/v4/graphql";
const accountTag =
  env.CLOUDFLARE_ACCOUNT ?? throwError("missing CLOUDLFARE_ACCOUNT");
const apiToken =
  env.CLOUDFLARE_API_TOKEN ?? throwError("missing CLOUDFLARE_API_TOKEN");

const params: UsageQueryParams = {
  accountTag,
  apiToken,
  limit: 1000,
  startDate: today,
  endDate: today,
  graphqlEndpoint,
};

await paginateKvOperations((batch: BatchResult<KvOperation>) => {
  for (const operation of batch.data) {
    console.log(
      `[kvOperations] namespace ${operation.dimensions.namespaceId}: ${operation.sum.requests} requests`
    );
  }
}, params);

await paginateKvStorage((batch: BatchResult<KvStorage>) => {
  for (const operation of batch.data) {
    console.log(
      `[kvStorage] namespace ${operation.dimensions.namespaceId}: ${operation.max.byteCount} bytes ${operation.max.keyCount} keys`
    );
  }
}, params);

await paginateR2Operations((batch: BatchResult<R2Operation>) => {
  for (const operation of batch.data) {
    console.log(
      `[r2Operations] bucket ${operation.dimensions.bucketName}: ${operation.sum.requests} requests`
    );
  }
}, params);

await paginateR2Storage((batch: BatchResult<R2Storage>) => {
  for (const operation of batch.data) {
    console.log(
      `[r2Storage] bucket ${operation.dimensions.bucketName}: ${operation.max.payloadSize} bytes ${operation.max.objectCount} objects`
    );
  }
}, params);

await paginateD1Operations((batch: BatchResult<D1Operation>) => {
  for (const operation of batch.data) {
    console.log(
      `[d1Operations] db ${operation.dimensions.databaseId}: ${operation.sum.readQueries} read queries ${operation.sum.rowsRead} rowsRead`
    );
  }
}, params);

await paginateD1Storage((batch: BatchResult<D1Storage>) => {
  for (const operation of batch.data) {
    console.log(
      `[d1Operations] db ${operation.dimensions.databaseId}: ${operation.max.databaseSizeBytes} bytes`
    );
  }
}, params);
