/**
 * Safe fetch helper that guarantees clean JSON parsing and never crashes with
 * "SyntaxError: Unexpected token '<', '<!doctype '... is not valid JSON".
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          error: data?.error || `Request failed with status ${res.status}`
        };
      }
      return { ok: true, status: res.status, data };
    }

    // Response is NOT json (e.g., HTML from upstream proxy or plain text error)
    const text = await res.text();
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Content was HTML or plain text
    }

    if (parsed && typeof parsed === 'object') {
      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          error: parsed.error || `Request failed with status ${res.status}`
        };
      }
      return { ok: true, status: res.status, data: parsed };
    }

    // HTML or other non-JSON response
    const snippet = text.replace(/<[^>]*>/g, '').trim().slice(0, 120);
    const errorMsg = !res.ok
      ? `Server returned HTTP ${res.status}: ${snippet || 'Non-JSON response'}`
      : 'Unexpected non-JSON response from server';

    return {
      ok: false,
      status: res.status,
      error: errorMsg
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      error: err.message || 'Network communication failed'
    };
  }
}
