export async function GET({ params, locals }) {
  const key = params.key;
  const bucket = locals?.runtime?.env?.R2_BUCKET;

  if (!key || !bucket) {
    return new Response('Not Found', { status: 404 });
  }

  const object = await bucket.get(key);
  if (!object) {
    return new Response('File Not Found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
}
