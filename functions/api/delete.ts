export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // 1. 鉴权
  const token = request.headers.get('Authorization');
  if (token !== `Bearer ${env.AUTH_TOKEN}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!key) {
    return new Response('Missing key', { status: 400 });
  }

  try {
    await env.BUCKET.delete(key);
    return new Response(JSON.stringify({ success: true, key }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(`Delete failed: ${error}`, { status: 500 });
  }
};
