export class SeConectaApiError extends Error {
  constructor(message: string, readonly status: number, readonly body?: unknown) {
    super(message);
    this.name = "SeConectaApiError";
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/seconecta/${path.replace(/^\/+/, "")}`, {
    ...init,
    headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
  });
  const body = await response.json().catch(() => null) as unknown;
  if (!response.ok) {
    const detail = body && typeof body === "object" && "detail" in body ? String(body.detail) : "Não foi possível concluir esta ação.";
    throw new SeConectaApiError(detail, response.status, body);
  }
  return body as T;
}
