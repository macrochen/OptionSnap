export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const token = request.headers.get('Authorization');
  if (token !== `Bearer ${env.AUTH_TOKEN}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const formData = await request.formData();
    const category = formData.get('category');
    
    if (category !== 'Options' && category !== 'Trades') {
      return new Response('Invalid category', { status: 400 });
    }

    const files = formData.getAll('file') as File[];
    if (!files || files.length === 0) {
      return new Response('No files uploaded', { status: 400 });
    }

    const uploadPromises = files.map(async (file) => {
      const ext = file.name.split('.').pop() || 'png';
      const key = `${category}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      
      const arrayBuffer = await file.arrayBuffer();
      
      // 存入 KV，并附带 7天 (604800秒) 的过期时间，以及 MIME 类型元数据
      await env.BUCKET.put(key, arrayBuffer, {
        expirationTtl: 604800,
        metadata: { type: file.type || 'image/jpeg' }
      });
      return key;
    });

    const keys = await Promise.all(uploadPromises);

    return new Response(JSON.stringify({ success: true, keys }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(`Upload failed: ${error}`, { status: 500 });
  }
};
