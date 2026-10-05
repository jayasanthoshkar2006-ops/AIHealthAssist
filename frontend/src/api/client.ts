import { readLocalRecord, saveLocalRecord } from '../storage/localDb';

const API_BASE_URL = 'https://aihealthassist-backend.onrender.com/api/v1';

const isPrivateDataEndpoint = (endpoint: string) =>
  !endpoint.startsWith('/auth/login') &&
  !endpoint.startsWith('/auth/register') &&
  !endpoint.startsWith('/auth/pin/');

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const token = localStorage.getItem('token');
  const useLocalCache = isPrivateDataEndpoint(endpoint);

  // Local IndexedDB is the durable client-side copy. For reads, use it first
  // when available, then refresh it from the server in the background.
  if (method === 'GET' && useLocalCache) {
    const cached = await readLocalRecord<T>(endpoint, method);
    if (cached !== null) {
      void refreshFromServer<T>(endpoint, options);
      return cached;
    }
  }

  return requestFromServer<T>(endpoint, options, useLocalCache);
}

async function refreshFromServer<T>(endpoint: string, options: RequestInit): Promise<void> {
  try {
    await requestFromServer<T>(endpoint, options, true);
  } catch (error) {
    console.warn('Background data refresh unavailable:', error);
  }
}

async function requestFromServer<T>(
  endpoint: string,
  options: RequestInit,
  persistLocally: boolean
): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  const response = await fetch(API_BASE_URL + endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Request failed with status ' + response.status);
  }

  if (headers['Accept'] === 'application/pdf') {
    return (await response.blob()) as unknown as T;
  }

  const data = (await response.json()) as T;

  if (persistLocally) {
    await saveLocalRecord(endpoint, (options.method || 'GET').toUpperCase(), data);
  }

  return data;
}
