import { env } from "node:process";
import { error } from "./utils";
import { activeOnlyD1, fullScanD1 } from "./graphql/d1";
import { getApolloClient } from "./graphql/client";
import { activeOnlyKv, fullScanKv } from "./graphql/kv";
import { activeOnlyR2, fullScanR2 } from "./graphql/r2";
import { ms } from "itty-time";

const account = env.CLOUDFLARE_ACCOUNT ?? error("missing CLOUDFLARE_ACCOUNT");
const activeStartDate = new Date(Date.now() - ms("3 days")).toISOString();
const activeEndDate = new Date().toISOString();
const usageStartDate = new Date(Date.now() - ms("3 days")).toISOString();
const usageEndDate = new Date().toISOString();
const batchSize = 1000;

const client = getApolloClient();

async function fullScan() {
  await fullScanKv(client, account, usageStartDate, usageEndDate, batchSize);
  await fullScanR2(client, account, usageStartDate, usageEndDate, batchSize);
  await fullScanD1(client, account, usageStartDate, usageEndDate, batchSize);
}

async function activeOnly() {
  const params = [
    client,
    account,
    activeStartDate,
    activeEndDate,
    usageStartDate,
    usageEndDate,
    batchSize,
  ] as const;
  await activeOnlyKv(...params);
  await activeOnlyR2(...params);
  await activeOnlyD1(...params);
}

// await fullScan();
await activeOnly();
