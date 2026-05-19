import { NativeModules } from 'react-native';

const DEFAULT_API_URL = 'http://localhost:3000';

export function resolveApiUrl(explicitApiUrl?: string, bundleUrl?: string) {
  if (explicitApiUrl) {
    return explicitApiUrl;
  }

  if (bundleUrl) {
    try {
      const url = new URL(bundleUrl);

      return `${url.protocol}//${url.hostname}:3000`;
    } catch {
      return DEFAULT_API_URL;
    }
  }

  return DEFAULT_API_URL;
}

const sourceCode = NativeModules.SourceCode as { scriptURL?: string } | undefined;

export const API_URL = resolveApiUrl(
  process.env.EXPO_PUBLIC_API_URL,
  sourceCode?.scriptURL,
);

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  token?: string;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? String(data.message)
        : 'Nao foi possivel concluir a solicitacao';

    throw new Error(message);
  }

  return data as T;
}
