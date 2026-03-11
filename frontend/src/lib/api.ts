export const API_URL = "/api";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (res.status === 401) {
  localStorage.clear();
  window.dispatchEvent(new Event("auth:logout"));
  throw new Error("");
}

  if (!res.ok) {
    throw new Error(data?.error || "Erro na API");
  }

  return data;
}