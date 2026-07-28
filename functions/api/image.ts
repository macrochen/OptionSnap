export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // 1. 鉴权：支持 Header 和 URL 参数 (方便 img 标签直接引用)
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
    const object = await env.BUCKET.get(key);
    
    if (!object) {
      return new Response('Image not found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);

    return new Response(object.body, { headers });
  } catch (error) {
    return new Response(`Fetch failed: ${error}`, { status: 500 });
  }
};
