import { env, RpcTarget, WorkerEntrypoint } from 'cloudflare:workers';

/**
 * BindingWrapperWorker acts as a wrapper around bindings.
 */
export default class BindingWrapperWorker extends WorkerEntrypoint {
	/**
	 * Returns a wrapped KV binding
	 */
	async kv(namespaceID: string) {
		return new KVWrapper(namespaceID);
	}

	/**
	 * imagine we did the same thing for D1, etc...
	 */

	/**
	 * unused: all Workers must implement a named handler such as fetch
	 */
	async fetch() {
		return new Response(null, { status: 404 });
	}
}

/**
 * KVWrapper provides the same interface as a KV Binding
 * but enforces limits and emits usage data behind the scenes.
 */
export class KVWrapper extends RpcTarget {
	constructor(private namespaceID: string) {
		super();
	}

	async get(key: string): Promise<string | null> {
		await enforceLimit(this.namespaceID);
		const val = env.KV.get(key);
		await emitUsageEvent(this.namespaceID, 'get', key);
		return val;
	}

	async put(key: string, val: string): Promise<void> {
		await enforceLimit(this.namespaceID);
		await env.KV.put(key, val);
		await emitUsageEvent(this.namespaceID, 'put', key);
	}
}

async function enforceLimit(namespaceID: string) {
	// this could be updated to throw an error if the limit has been reached
	console.log(`pretending to enforce limit for KV namespace ${namespaceID}`);
}

async function emitUsageEvent(namespaceID: string, operation: 'put' | 'get', key: string) {
	// the key could be logged for auditing purposes if desired, but may contain PII
	env.USAGE.writeDataPoint({ indexes: [namespaceID], blobs: [operation, key] });
}
