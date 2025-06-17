import { env, RpcTarget } from 'cloudflare:workers';

// Dynamic KV Namespaces
interface KVNamespaces {
	get: (name: string) => KVNamespace;
}

// Dynamic D1 Databases
interface D1Databases {
	get: (name: string) => D1Database;
}

// Group of resources separated by type.
// Each type provides a method to `get()` the resource by name
interface ResourceGroup {
	workers: DispatchNamespace;
	kvNamespaces: KVNamespaces;
	d1Databases: D1Databases;
}

// The top level bindings for the dispatcher worker
interface Env {
	RESOURCES: ResourceGroup;
	USAGE: AnalyticsEngineDataset;
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
		const userWorker = env.RESOURCES.workers.get(appName) as any;
		using userKV = new WrappedKVNamespace(appName, env);
		using userD1 = new WrappedD1Database(appName, env);

		// Invoke the app worker: it only has access to the "wrapped" bindings
		return userWorker.handleRequest(request, { kv: userKV, d1: userD1 });
	},
};

class WrappedKVNamespace extends RpcTarget {
	private namespace: KVNamespace;
	constructor(private namespaceID: string, private env: Env) {
		super();
		this.namespace = env.RESOURCES.kvNamespaces.get(namespaceID);
	}
	async get(key: string) {
		await enforceLimit('kv', this.namespaceID);
		const val = await this.namespace.get(key);
		await emitUsageEvent(this.env, 'kv', this.namespaceID, 'get');
		return val;
	}
	async put(key: string, val: string) {
		await enforceLimit('kv', this.namespaceID);
		await this.namespace.put(key, val);
		await emitUsageEvent(this.env, 'kv', this.namespaceID, 'put');
	}
}

class WrappedD1Database extends RpcTarget {
	private database: D1Database;
	constructor(private databaseName: string, private env: Env) {
		super();
		this.database = env.RESOURCES.d1Databases.get(databaseName);
	}
	async exec(args: Parameters<D1Database['exec']>) {
		await enforceLimit('d1', this.databaseName);
		const result = await this.database.exec(...args);
		await emitUsageEvent(this.env, 'd1', this.databaseName, 'exec');
		return result;
	}
}

async function enforceLimit(resourceType: 'kv' | 'd1', resourceID: string) {
	// this could be updated to throw an error if the limit has been reached
	console.log(`pretending to enforce limit for ${resourceType}-${resourceID}`);
}

async function emitUsageEvent(env: Env, resourceType: 'kv' | 'd1', resourceID: string, operation: string) {
	env.USAGE.writeDataPoint({ indexes: [resourceID], blobs: [operation] });
}
