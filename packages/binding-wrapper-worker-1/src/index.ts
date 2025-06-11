import { env, RpcTarget, WorkerEntrypoint } from 'cloudflare:workers';

export default class BindingWrapperWorker extends WorkerEntrypoint {
	// Currently, entrypoints without a named handler are not supported
	async fetch() {
		return new Response(null, { status: 404 });
	}

	async kv() {
		return new KVWrapper();
	}
}

export class KVWrapper extends RpcTarget {
	async get(key: string): Promise<string | null> {
		return env.KV.get(key);
	}

	async put(key: string, val: string): Promise<void> {
		return env.KV.put(key, val);
	}
}
