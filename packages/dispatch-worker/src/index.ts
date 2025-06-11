
export default {
	async fetch(request, env, ctx): Promise<Response> {
		try {
			// TODO it would be nice to improve the typescript types here for RPC (remove 'any')
			const userWorker = env.DISPATCHER.get('user-worker-1') as any;
			const bindingWrapper = env.DISPATCHER.get('binding-wrapper-worker-1') as any;
			using kvWrapper = await bindingWrapper.kv('user-worker-1');
			const resp = await userWorker.handleRequest(kvWrapper, request);
			return resp;
		} catch (e) {
			return new Response(String(e), { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
