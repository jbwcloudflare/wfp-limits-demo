import { env, RpcTarget, WorkerEntrypoint } from 'cloudflare:workers';
import { Hono } from 'hono';

/**
 * UserWorker is called by the dynamic dispatcher.
 * This worker has direct access to the KV binding: it exposes it up to the Dispatcher via the `getKV()` RPC method
 * Then, the Dispatcher "wraps" the binding (to add limit enforcement),
 * and passes the wrappedKV namespace to this Worker's handleRequest function
 */

export default class UserWorker extends WorkerEntrypoint {
	// TODO I couldn't figure out how to call the normal fetch() function with extra params (like the wrapped KV namespace)
	// So I added this RPC target instead and called it directly from the dispatcher
	async handleRequest(wrappedKV: KVNamespace, request: Request): Promise<Response> {
		return app.fetch(request, { kv: wrappedKV });
	}

	async fetch(): Promise<Response> {
		return new Response('', { status: 404 });
	}

	async getKV() {
		return new KVRPC(env.KV);
	}
}

// A simple hono app to get/put keys from KV
const app = new Hono<{ Bindings: { kv: KVNamespace } }>();

app.get('/:key', async (c) => {
	const val = await c.env.kv.get(c.req.param('key'));
	return c.text(val ?? 'null');
});

app.post('/:key', async (c) => {
	await c.env.kv.put(c.req.param('key'), await c.req.text());
	return c.text('OK');
});

app.onError((err, c) => {
	console.error(`${err}`);
	return c.text(String(err.stack), 500);
});

class KVRPC extends RpcTarget {
	constructor(private namespace: KVNamespace) {
		super();
	}

	get(key: string) {
		return this.namespace.get(key);
	}

	put(key: string, value: string) {
		return this.namespace.put(key, value);
	}
}
