export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // 1. 鉴权
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
      // 生成唯一文件名: category/timestamp-uuid.extension
      const ext = file.name.split('.').pop() || 'png';
      const key = `${category}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      
      await env.BUCKET.put(key, file.stream(), {
        httpMetadata: { contentType: file.type },
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
