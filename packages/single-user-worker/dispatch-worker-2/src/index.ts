import { env } from 'cloudflare:workers';

export default {
	async fetch(request, env, ctx): Promise<Response> {
		try {
			// TODO it would be nice to improve the typescript types here for RPC (remove 'any')
			const userWorker = env.DISPATCHER.get('user-worker-2') as any;

			// This is awkward: I had originally hoped to pass a function 
			// that would accept the user worker's KV namespace, and return a "wrapped" version.
			// BUT you can't pass a KV namespace as an RPC parameter!
			// This workaround has the user worker expose the namespace via an RPC method instead
			using rawKV = await userWorker.getKV();
			const wrappedKV = wrapKV('user-worker-2', rawKV);
			const resp = await userWorker.handleRequest(wrappedKV, request);
			return resp;
		} catch (e) {
			return new Response(String(e), { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;

function wrapKV(namespaceID: string, namespace: KVNamespace) {
	return {		
		get: async (key: string) => {
			await enforceLimit(namespaceID);
			const val = await namespace.get(key);
			await emitUsageEvent(namespaceID, 'get', key);
			return val;
		},
		put: async (key: string, val: string) => {
			await enforceLimit(namespaceID);
			await namespace.put(key, val);
			await emitUsageEvent(namespaceID, 'put', key);
		},
	
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
