export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const urlParam = (req.query && req.query.url)
      || new URL(req.url, 'http://localhost').searchParams.get('url');

    if (!urlParam || typeof urlParam !== 'string') {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    
    try {
      const u = new URL(urlParam);
      const isS3 = u.hostname.includes('s3.') && u.searchParams.get('X-Amz-Signature');
      if (!isS3) {
        console.log('Invalid S3 URL check:', { hostname: u.hostname, hasSignature: !!u.searchParams.get('X-Amz-Signature') });
        return res.status(400).json({ error: 'Only S3 presigned URLs are allowed' });
      }
    } catch {
      return res.status(400).json({ error: 'Invalid url' });
    }

    console.log('Fetching from upstream:', urlParam);
    const upstream = await fetch(urlParam);
    
    console.log('Upstream response status:', upstream.status, upstream.statusText);
    
    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => 'Could not read error response');
      console.error('Upstream fetch failed:', {
        status: upstream.status,
        statusText: upstream.statusText,
        error: errorText,
        url: urlParam
      });
      return res.status(upstream.status).json({ 
        error: 'Upstream fetch failed',
        details: errorText,
        status: upstream.status
      });
    }

  
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const contentLength = upstream.headers.get('content-length');

    res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    res.setHeader('Cache-Control', 'private, max-age=60');

    const arrayBuffer = await upstream.arrayBuffer();
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('image-proxy error:', error);
    return res.status(500).json({ 
      error: 'Proxy failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}


