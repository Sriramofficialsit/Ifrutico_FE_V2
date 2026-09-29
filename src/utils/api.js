export const BASE_URL = "";

/**
 * Authenticated fetch wrapper — always sends cookies.
 * Automatically handles JSON and FormData payloads.
 */
export async function apiFetch(path, options = {}) {
  const { body, method = "GET", headers = {}, ...rest } = options;

  const isFormData = body instanceof FormData;
  const finalHeaders = { ...headers };

  if (!isFormData && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  // Ensure all API calls are correctly namespaced under /api to avoid FE conflicts 
  const apiPath = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? '' : '/'}${path}`;

  const res = await fetch(`${BASE_URL}${apiPath}`, {
    method,
    credentials: "include",
    headers: finalHeaders,
    body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
    ...rest,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }

  return data;
}

/**
 * URL for a file the backend stores/serves (product images, avatars). The DB keeps paths like
 * "/uploads/products/x.png"; they must go through the same /api proxy as every other request.
 * Builds exactly one slash between "/api" and the path (a double slash 404s behind the dev proxy).
 */
export function assetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return encodeURI(`/api/${String(path).replace(/^\/+(api\/)?/, '')}`);
}

/** Downloads the exact invoice PDF the backend emails to customers. Throws with a readable message on failure. */
export async function downloadInvoicePdf(billId, invoiceNumber) {
  const res = await fetch(`/api/bill/${billId}/pdf`, { credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Could not download invoice (${res.status})`);
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice_${invoiceNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
