import type {
  CalendarEventType,
  LiturgicalSeason,
  MassSuitability,
  RehearsalBlockType,
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
  massMoments?: string[];
  youtubeUrl?: string | null;
  sheetMusicUrl?: string | null;
  audioUrl?: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  choir: {
    id: string;
    name: string;
    parish: string;
  };
  createdBy?: {
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
  massMoments?: string[];
  youtubeUrl?: string;
  sheetMusicUrl?: string;
  audioUrl?: string;
  isPublic: boolean;
}

export interface CalendarEventDTO {
  id: string;
  choirId: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string | null;
  type: CalendarEventType;
  massScheduleId: string | null;
  rehearsalScheduleId: string | null;
  massSchedule?: {
    id: string;
    title: string;
    liturgicalSeason: LiturgicalSeason;
  } | null;
  rehearsalSchedule?: {
    id: string;
    title: string;
    generalObjective: string;
  } | null;
}

export interface MassScheduleItemDTO {
  id: string;
  sortOrder: number;
  momentName: string;
  songId: string | null;
  targetKey: string | null;
  directorNotes: string | null;
  song: SongDTO | null;
}

export interface MassScheduleDTO {
  id: string;
  choirId: string;
  title: string;
  date: string;
  liturgicalSeason: LiturgicalSeason;
  celebrantNotes: string | null;
  items: MassScheduleItemDTO[];
}

export interface RehearsalBlockDTO {
  id: string;
  sortOrder: number;
  title: string;
  blockType: RehearsalBlockType;
  durationMinutes: number;
  detailedNotes: string;
  isCompleted: boolean;
  songs: {
    id: string;
    songId: string;
    focusNotes: string | null;
    song: SongDTO;
  }[];
}

export interface RehearsalScheduleDTO {
  id: string;
  choirId: string;
  title: string;
  date: string;
  location: string;
  generalObjective: string;
  blocks: RehearsalBlockDTO[];
}

export interface ChoirDetailsDTO {
  id: string;
  name: string;
  parish: string;
  inviteCode: string;
  members: {
    id: string;
    role: Role;
    instrument: string | null;
    joinedAt: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
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

  // Calendario Manipulable
  getCalendarEvents: () =>
    request<{ events: CalendarEventDTO[] }>('/api/calendar'),

  createCalendarEvent: (payload: {
    title: string;
    description?: string;
    location?: string;
    startAt: string;
    endAt?: string;
    type: CalendarEventType;
    massScheduleId?: string;
    rehearsalScheduleId?: string;
  }) =>
    request<{ event: CalendarEventDTO }>('/api/calendar', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  moveCalendarEvent: (id: string, startAt: string) =>
    request<{ event: CalendarEventDTO }>(`/api/calendar/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ startAt }),
    }),

  deleteCalendarEvent: (id: string) =>
    request<{ success: boolean }>(`/api/calendar/${id}`, {
      method: 'DELETE',
    }),

  // Cronogramas de Misa
  getMassSchedules: () =>
    request<{ schedules: MassScheduleDTO[] }>('/api/mass-schedules'),

  createMassSchedule: (payload: {
    title: string;
    date: string;
    liturgicalSeason: LiturgicalSeason;
    celebrantNotes?: string;
    items: {
      momentName: string;
      songId?: string | null;
      targetKey?: string | null;
      directorNotes?: string | null;
    }[];
  }) =>
    request<{ schedule: MassScheduleDTO }>('/api/mass-schedules', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateMassSchedule: (
    id: string,
    payload: {
      title: string;
      date: string;
      liturgicalSeason: LiturgicalSeason;
      celebrantNotes?: string;
      items: {
        momentName: string;
        songId?: string | null;
        targetKey?: string | null;
        directorNotes?: string | null;
      }[];
    }
  ) =>
    request<{ schedule: MassScheduleDTO }>(`/api/mass-schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteMassSchedule: (id: string) =>
    request<{ success: boolean }>(`/api/mass-schedules/${id}`, {
      method: 'DELETE',
    }),

  // Cronogramas de Ensayo
  getRehearsalSchedules: () =>
    request<{ rehearsals: RehearsalScheduleDTO[] }>('/api/rehearsal-schedules'),

  createRehearsalSchedule: (payload: {
    title: string;
    date: string;
    location: string;
    generalObjective: string;
    blocks: {
      title: string;
      blockType: RehearsalBlockType;
      durationMinutes: number;
      detailedNotes: string;
      isCompleted?: boolean;
      songIds?: string[];
    }[];
  }) =>
    request<{ rehearsal: RehearsalScheduleDTO }>('/api/rehearsal-schedules', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  toggleRehearsalBlock: (scheduleId: string, blockId: string) =>
    request<{ success: boolean; isCompleted: boolean }>(
      `/api/rehearsal-schedules/${scheduleId}/blocks/${blockId}/toggle`,
      {
        method: 'PATCH',
      }
    ),

  deleteRehearsalSchedule: (id: string) =>
    request<{ success: boolean }>(`/api/rehearsal-schedules/${id}`, {
      method: 'DELETE',
    }),

  // Mi Coro
  getChoirMembers: () =>
    request<{ choir: ChoirDetailsDTO }>('/api/choir/members'),
};
