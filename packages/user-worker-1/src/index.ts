import { env, WorkerEntrypoint } from 'cloudflare:workers';
import { Hono } from 'hono';

/**
 * UserWorker is called by the dynamic dispatcher.
 * The dispatcher passes in pre-wrapped bindings that transparently enforce limits and emit usage data behind the scenes
 */
export default class UserWorker extends WorkerEntrypoint {
	// TODO I couldn't figure out how to call the normal fetch() function with extra params (like the kv namespace)
	// So I added this RPC target instead and called it directly from the dispatcher
	async handleRequest(kv: KVNamespace, request: Request): Promise<Response> {
		return app.fetch(request, { ...env, kv });
	}

	async fetch(): Promise<Response> {
		return new Response('', { status: 404 });
	}
}

// A simple hono app to get/put keys from KV
const app = new Hono<{ Bindings: Env & { kv: KVNamespace } }>();

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
	return c.text(String(err), 500);
});
