export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // 1. 鉴权
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
    // 列出指定前缀（分类）下的对象
    const listed = await env.BUCKET.list({ prefix: `${category}/` });
    
    // 生成包含 key 和下载链接的列表
    const files = listed.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded
    }));

    return new Response(JSON.stringify({ success: true, files }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(`List failed: ${error}`, { status: 500 });
  }
};
