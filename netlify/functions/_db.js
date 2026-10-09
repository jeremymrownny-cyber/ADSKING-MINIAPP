const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function dbConfigured() {
  return Boolean(url && key);
}

export async function supabase(path, options = {}) {
  if (!dbConfigured()) throw new Error('Supabase environment variables are not configured');
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...options.headers
  };
  const res = await fetch(`${url}/rest/v1/${path}`, {...options, headers});
  const text = await res.text();
  let body; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) throw new Error(typeof body === 'string' ? body : JSON.stringify(body));
  return body;
}

export function json(data, status=200) {
  return new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json'}});
}
