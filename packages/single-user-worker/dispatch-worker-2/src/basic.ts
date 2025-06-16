import { env } from 'cloudflare:workers';

interface KVNamespaceGroup {
	get: (name: string) => KVNamespace;
}

interface D1DatabaseGroup {
	get: (name: string) => D1Database;
}

interface Env {
	WORKERS: DispatchNamespace;
	KVS: KVNamespaceGroup;
	D1S: D1DatabaseGroup;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		// Grab the app name from the URL to figure out which app to load
		const appName = new URL(request.url).pathname;
		if (!/^.{1,64}$/.test(appName)) {
			return new Error(`Invalid app name: ${appName}`);
		}

		// Load the worker and resources associated with the app:
		// wrapping the KV and D1 bindings with usage enforcement
		const userWorker = env.WORKERS.get(appName) as any;
		const userKV = wrapKV(env, appName);
		const userD1 = wrapD1(env, appName);

		// Invoke the app worker: it only has access to the "wrapped" bindings
		return userWorker.handleRequest(request, { kv: userKV, d1: userD1 });
	},
};

function wrapKV(env: Env, namespaceID: string) {
	const namespace = env.KVS.get(namespaceID);
	return {
		get: async (key: string) => {
			await enforceLimit(namespaceID);
			const val = await namespace.get(key);
			await emitUsageEvent('kv', namespaceID, 'get');
			return val;
		},
		put: async (key: string, val: string) => {
			await enforceLimit(namespaceID);
			await namespace.put(key, val);
			await emitUsageEvent('kv', namespaceID, 'put');
		},
	};
}

function wrapD1(env: Env, databaseID: string) {
	const database = env.D1S.get(databaseID);
	return {
		exec(args: Parameters<typeof database.exec>) {
			return database.exec(...args);
		},
		batch(args: Parameters<typeof database.batch>) {
			return database.batch(...args);
		},
		prepare(args: Parameters<typeof database.prepare>) {
			return database.prepare(...args);
		},
		withSession(args: Parameters<typeof database.withSession>) {
			return database.withSession(...args);
		},
	};
}

async function enforceLimit(namespaceID: string) {
	// this could be updated to throw an error if the limit has been reached
	console.log(`pretending to enforce limit for KV namespace ${namespaceID}`);
}

async function emitUsageEvent(resourceType: 'kv' | 'd1', resourceID: string, operation: string) {
	env.USAGE.writeDataPoint({ indexes: [resourceID], blobs: [operation] });
}
