export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const token = request.headers.get('Authorization');
  if (token !== `Bearer ${env.AUTH_TOKEN}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(request.url);
  const category = url.searchParams.get('category');

  if (category !== 'Options' && category !== 'Trades') {
    return new Response('Invalid category', { status: 400 });
  }

  try {
    // 从 KV 列表拉取
    const listed = await env.BUCKET.list({ prefix: `${category}/` });
    
    // 生成包含 key 的列表 (KV 没有 size 等元数据，可以直接只返还 key)
    const files = listed.keys.map(k => ({
      key: k.name
    }));

    return new Response(JSON.stringify({ success: true, files }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(`List failed: ${error}`, { status: 500 });
  }
};
