import type {
  LiturgicalSeason,
  MassSuitability,
  Role,
} from '@cantos/shared';

const API_BASE =
  (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env
    ?.VITE_API_URL || 'http://localhost:4000';

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  choirId: string;
  choirName: string;
  parish: string;
  role: Role;
  inviteCode?: string;
}

export interface SongDTO {
  id: string;
  choirId: string;
  createdById: string;
  title: string;
  author: string;
  baseKey: string;
  lyricsAndChords: string;
  liturgicalSeasons: LiturgicalSeason[];
  massSuitability: MassSuitability;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  choir: {
    id: string;
    name: string;
    parish: string;
  };
  createdBy: {
    id: string;
    name: string;
  };
}

export interface CreateOrUpdateSongInput {
  title: string;
  author: string;
  baseKey: string;
  lyricsAndChords: string;
  liturgicalSeasons: LiturgicalSeason[];
  massSuitability: MassSuitability;
  isPublic: boolean;
}

const TOKEN_KEY = 'cantos_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Error HTTP ${res.status}`);
  }
  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: {
    name: string;
    email: string;
    password: string;
    mode: 'CREATE_CHOIR' | 'JOIN_CHOIR';
    choirName?: string;
    parish?: string;
    inviteCode?: string;
  }) =>
    request<{ token: string; user: AuthUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => request<{ user: AuthUser }>('/api/auth/me'),

  getSongs: (params: {
    q?: string;
    season?: string;
    suitability?: string;
    scope?: string;
  }) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set('q', params.q);
    if (params.season && params.season !== 'ALL') sp.set('season', params.season);
    if (params.suitability && params.suitability !== 'ALL')
      sp.set('suitability', params.suitability);
    if (params.scope) sp.set('scope', params.scope);
    const qs = sp.toString();
    return request<{ songs: SongDTO[] }>(`/api/songs${qs ? `?${qs}` : ''}`);
  },

  createSong: (input: CreateOrUpdateSongInput) =>
    request<{ song: SongDTO }>('/api/songs', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateSong: (id: string, input: CreateOrUpdateSongInput) =>
    request<{ song: SongDTO }>(`/api/songs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  deleteSong: (id: string) =>
    request<{ success: boolean }>(`/api/songs/${id}`, {
      method: 'DELETE',
    }),
};
