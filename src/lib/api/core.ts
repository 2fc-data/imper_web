export interface LoginResponse {
  token: string;
  user: {
    id: number;
    nome: string;
    email: string;
    papel: string;
    permissoes: string[];
  };
}

const TOKEN_KEY = 'imper_token';

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ??
  '/api';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!res.ok) {
      let message = res.statusText || 'Erro inesperado';
      let details: unknown;
      try {
        const body = await res.json();
        if (typeof body?.message === 'string') message = body.message;
        // Backends que devolvem o payload direto (ex.: HttpException com
        // {codigo, pendencias}) não trazem `details`; usa o corpo inteiro.
        details =
          body?.details ??
          (typeof body === 'object' && body !== null ? body : undefined);
      } catch {
        /* corpo não-JSON */
      }
      const err = new Error(message) as Error & {
        status?: number;
        details?: unknown;
      };
      err.status = res.status;
      err.details = details;
      throw err;
    }

    if (res.status === 204) return undefined as T;
    const text = await res.text();
    if (!text || text.trim() === '') return undefined as T;
    const contentType = res.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      throw new Error(
        `Resposta inválida do servidor (${res.status}): esperava JSON mas recebeu ${contentType}`,
      );
    }
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

function montarQuery(params?: QueryParams): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === null) continue;
    sp.set(chave, String(valor));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  get: <T>(path: string, params?: QueryParams) =>
    request<T>(`${path}${montarQuery(params)}`),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
