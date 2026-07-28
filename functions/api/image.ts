export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // 1. 鉴权：支持 Header 和 URL 参数
  let token = request.headers.get('Authorization');
  if (token && token.startsWith('Bearer ')) {
    token = token.substring(7);
  } else {
    token = url.searchParams.get('token');
  }

  if (token !== env.AUTH_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }

  const key = url.searchParams.get('key');

  if (!key) {
    return new Response('Missing key', { status: 400 });
  }

  try {
    // 从 KV 连带 metadata 一起取，并指定类型为 arrayBuffer
    const { value, metadata } = await env.BUCKET.getWithMetadata<{type: string}>(key, 'arrayBuffer');
    
    if (!value) {
      return new Response('Image not found', { status: 404 });
    }

    const headers = new Headers();
    // 使用存入时的 contentType，或默认 fallback
    headers.set('Content-Type', metadata?.type || 'image/jpeg');

    return new Response(value, { headers });
  } catch (error) {
    return new Response(`Fetch failed: ${error}`, { status: 500 });
  }
};
