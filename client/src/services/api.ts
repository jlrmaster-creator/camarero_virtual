const BASE_URL = '/api';

export class ApiError extends Error {
  constructor(public status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function getSessionHeaders(): Record<string, string> {
  try {
    const raw = localStorage.getItem('camarero_session');
    if (raw) {
      const session = JSON.parse(raw);
      if (session?.codigo) {
        return { 'X-Session-Code': session.codigo };
      }
    }
  } catch {
    // ignore
  }
  return {};
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    const { headers: optHeaders, ...restOptions } = options ?? {};
    res = await fetch(`${BASE_URL}${url}`, {
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        ...getSessionHeaders(),
        ...(optHeaders as Record<string, string> ?? {}),
      },
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'No se puede conectar con el servidor');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    const err = body?.error as Record<string, string> | undefined;
    const message = err?.message ??
      (res.status === 404
        ? 'Servidor no disponible (modo vista)'
        : `Error del servidor (${res.status})`);
    throw new ApiError(res.status, err?.code ?? 'UNKNOWN', message);
  }

  const body = await res.json() as { data: T };
  return body.data;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, data?: unknown) =>
    request<T>(url, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(url: string, data?: unknown) =>
    request<T>(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
