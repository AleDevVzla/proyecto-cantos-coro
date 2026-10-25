import React, { useEffect, useState, useCallback } from 'react';
import {
  LITURGICAL_SEASONS_ORDERED,
  type LiturgicalSeason,
  type MassSuitability,
} from '@cantos/shared';
import {
  api,
  getStoredToken,
  setStoredToken,
  type AuthUser,
  type CreateOrUpdateSongInput,
  type SongDTO,
} from './lib/api';
import { LoginView } from './components/LoginView';
import { ChordSheetViewer } from './components/ChordSheetViewer';
import { SongFormModal } from './components/SongFormModal';
import {
  Music2,
  Search,
  PlusCircle,
  Globe2,
  Lock,
  LogOut,
  ShieldCheck,
  UserCheck,
  Edit3,
  Trash2,
  BookOpen,
  Sparkles,
  Filter,
  KeyRound,
} from 'lucide-react';

export const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Filtros del Buscador Libre de Cantos
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<
    LiturgicalSeason | 'ALL'
  >('ALL');
  const [selectedSuitability, setSelectedSuitability] = useState<
    MassSuitability | 'ALL'
  >('ALL');
  const [selectedScope, setSelectedScope] = useState<
    'ALL' | 'MY_CHOIR' | 'PUBLIC_OTHER'
  >('ALL');

  const [songs, setSongs] = useState<SongDTO[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [activeSong, setActiveSong] = useState<SongDTO | null>(null);

  // Modal de subida / edición (exclusivo Director)
  const [showSongModal, setShowSongModal] = useState(false);
  const [editingSong, setEditingSong] = useState<SongDTO | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuthChecking(false);
      return;
    }
    api
      .getMe()
      .then((res) => {
        setUser(res.user);
      })
      .catch(() => {
        setStoredToken(null);
        setUser(null);
      })
      .finally(() => setAuthChecking(false));
  }, []);

  const fetchSongs = useCallback(async () => {
    if (!user) return;
    setLoadingSongs(true);
    try {
      const res = await api.getSongs({
        q: searchQuery,
        season: selectedSeason,
        suitability: selectedSuitability,
        scope: selectedScope,
      });
      setSongs(res.songs);
      setActiveSong((prev) => {
        if (!prev) return res.songs[0] || null;
        const updated = res.songs.find((s) => s.id === prev.id);
        return updated || res.songs[0] || null;
      });
    } catch (err) {
      console.error('Error cargando cantos:', err);
    } finally {
      setLoadingSongs(false);
    }
  }, [user, searchQuery, selectedSeason, selectedSuitability, selectedScope]);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  const handleLoginSuccess = (token: string, loggedUser: AuthUser) => {
    setStoredToken(token);
    setUser(loggedUser);
  };

  const handleLogout = () => {
    setStoredToken(null);
    setUser(null);
    setSongs([]);
    setActiveSong(null);
  };

  const handleSaveSong = async (input: CreateOrUpdateSongInput) => {
    if (editingSong) {
      const res = await api.updateSong(editingSong.id, input);
      setActiveSong(res.song);
    } else {
      const res = await api.createSong(input);
      setActiveSong(res.song);
    }
    await fetchSongs();
  };

  const handleToggleSongPublic = async (song: SongDTO) => {
    if (!user || user.role !== 'DIRECTOR' || song.choirId !== user.choirId)
      return;
    const res = await api.updateSong(song.id, {
      title: song.title,
      author: song.author,
      baseKey: song.baseKey,
      lyricsAndChords: song.lyricsAndChords,
      liturgicalSeasons: song.liturgicalSeasons,
      massSuitability: song.massSuitability,
      isPublic: !song.isPublic,
    });
    setActiveSong(res.song);
    await fetchSongs();
  };

  const handleDeleteSong = async (song: SongDTO) => {
    if (!window.confirm(`¿Deseas eliminar el canto "${song.title}"?`)) return;
    await api.deleteSong(song.id);
    setActiveSong(null);
    await fetchSongs();
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900 text-amber-200">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <Music2 className="h-5 w-5 animate-bounce text-amber-400" />
          Cargando Cantoral Coral...
        </div>
      </div>
    );
  }

  // SISTEMA CERRADO BAJO AUTENTICACIÓN: Si no hay sesión, mostrar Login obligatorio
  if (!user) {
    return <LoginView onSuccess={handleLoginSuccess} />;
  }

  const isDirector = user.role === 'DIRECTOR';
  const canManageActiveSong =
    isDirector && activeSong && activeSong.choirId === user.choirId;

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 text-stone-900">
      {/* Barra Superior de Identidad y Rol */}
      <header className="sticky top-0 z-30 border-b border-stone-800 bg-stone-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow">
              <Music2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight">
                  {user.choirName}
                </h1>
                <span className="hidden sm:inline-block text-xs text-stone-400">
                  • {user.parish}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-300">
                <span>{user.name}</span>
                {user.inviteCode && (
                  <span className="hidden md:inline-flex items-center gap-1 rounded bg-stone-800 px-2 py-0.5 font-mono text-[11px] text-amber-300 border border-stone-700">
                    <KeyRound className="h-3 w-3" /> Código: {user.inviteCode}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Indicador de Rol */}
            <div
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border ${
                isDirector
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              }`}
            >
              {isDirector ? (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Rol: Director del Coro
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  Rol: Miembro del Coro
                </>
              )}
            </div>

            {/* Botón Exclusivo del Director para Subir Cantos */}
            {isDirector && (
              <button
                type="button"
                onClick={() => {
                  setEditingSong(null);
                  setShowSongModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2 text-xs sm:text-sm shadow-md transition"
              >
                <PlusCircle className="h-4 w-4" />
                Subir Canto
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión"
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-700 bg-stone-800 hover:bg-stone-700 px-3 py-2 text-xs font-semibold text-stone-200 transition"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Panel de Búsqueda Libre y Clasificación Litúrgica */}
      <section className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">
          {/* Buscador Libre + Filtro Litúrgico/No Litúrgico + Alcance */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-6 relative">
              <Search className="h-5 w-5 text-stone-400 absolute left-4 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar libremente cantos por título, autor o fragmentos de la letra..."
                className="w-full rounded-2xl border border-stone-300 bg-stone-50/70 pl-12 pr-4 py-2.5 text-sm focus:bg-white focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Filtro Apropiado para Misa: Litúrgico - No litúrgico */}
            <div className="lg:col-span-3 flex items-center rounded-2xl border border-stone-200 bg-stone-100 p-1">
              {(
                [
                  { id: 'ALL', label: 'Todos' },
                  { id: 'LITURGICO', label: 'Litúrgico' },
                  { id: 'NO_LITURGICO', label: 'No litúrgico' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedSuitability(opt.id)}
                  className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition ${
                    selectedSuitability === opt.id
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Filtro de Alcance: Mi Coro vs Públicos de otros coros */}
            <div className="lg:col-span-3 flex items-center rounded-2xl border border-stone-200 bg-stone-100 p-1">
              {(
                [
                  { id: 'ALL', label: 'Todos' },
                  { id: 'MY_CHOIR', label: 'Mi Coro' },
                  { id: 'PUBLIC_OTHER', label: 'Otros Coros' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedScope(opt.id)}
                  className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition ${
                    selectedScope === opt.id
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* División por Tiempo en el Año en el orden exacto: Ordinario - Cuaresma - Pascua - Adviento - Navidad */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 mr-1">
              <Filter className="h-3.5 w-3.5 text-amber-600" />
              Tiempo en el año:
            </span>

            <button
              type="button"
              onClick={() => setSelectedSeason('ALL')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold border transition ${
                selectedSeason === 'ALL'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
            >
              Todos los tiempos
            </button>

            {LITURGICAL_SEASONS_ORDERED.map((season, idx) => {
              const active = selectedSeason === season.id;
              return (
                <button
                  key={season.id}
                  type="button"
                  onClick={() => setSelectedSeason(season.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold border transition ${
                    active
                      ? `${season.badgeBg} ${season.badgeText} ${season.badgeBorder} ring-2 ring-amber-500/30 shadow-sm`
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span className="opacity-60 font-mono">{idx + 1}.</span>
                  {season.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cuerpo Principal: Listado de Cantos + Visor Interactivo de Letra y Acordes */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Lista de Cantos Encontrados */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Repertorio Disponible ({songs.length} cantos)
            </h2>
            {isDirector && (
              <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                Modo Director Activo
              </span>
            )}
          </div>

          {loadingSongs ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
              Buscando cantos en el repertorio...
            </div>
          ) : songs.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center space-y-3">
              <p className="text-sm font-semibold text-stone-700">
                No se encontraron cantos con los filtros seleccionados.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSeason('ALL');
                  setSelectedSuitability('ALL');
                  setSelectedScope('ALL');
                }}
                className="rounded-xl bg-stone-900 text-white px-4 py-2 text-xs font-semibold"
              >
                Limpiar filtros de búsqueda
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {songs.map((song) => {
                const isSelected = activeSong?.id === song.id;
                const isOwnChoir = song.choirId === user.choirId;

                return (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => setActiveSong(song)}
                    className={`w-full text-left rounded-2xl border p-4 transition shadow-sm ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-500/20'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-stone-900 text-base leading-snug">
                          {song.title}
                        </h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {song.author} •{' '}
                          <span className="font-medium text-stone-700">
                            {song.choir.name}
                          </span>
                        </p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-stone-900 px-2.5 py-1 text-xs font-mono font-bold text-amber-300">
                        {song.baseKey}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      {/* Etiquetas de Tiempo en el Año */}
                      {LITURGICAL_SEASONS_ORDERED.filter((s) =>
                        song.liturgicalSeasons.includes(s.id)
                      ).map((season) => (
                        <span
                          key={season.id}
                          className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${season.badgeBg} ${season.badgeText} ${season.badgeBorder}`}
                        >
                          {season.label}
                        </span>
                      ))}

                      {/* Etiqueta Litúrgico / No litúrgico */}
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          song.massSuitability === 'LITURGICO'
                            ? 'bg-sky-50 text-sky-800 border border-sky-200'
                            : 'bg-orange-50 text-orange-800 border border-orange-200'
                        }`}
                      >
                        {song.massSuitability === 'LITURGICO'
                          ? 'Litúrgico'
                          : 'No litúrgico'}
                      </span>

                      {/* Etiqueta Público vs Privado */}
                      <span
                        className={`ml-auto inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          song.isPublic
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-stone-100 text-stone-700 border border-stone-300'
                        }`}
                      >
                        {song.isPublic ? (
                          <>
                            <Globe2 className="h-3 w-3" />
                            {isOwnChoir ? 'Público' : 'Público (Otro coro)'}
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3" />
                            Privado de mi coro
                          </>
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna Derecha: Visor de Canto Seleccionado */}
        <div className="lg:col-span-7">
          {activeSong ? (
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-5">
              {/* Encabezado del Canto */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold text-stone-900">
                      {activeSong.title}
                    </h2>
                    <span
                      className={`rounded-lg px-2.5 py-0.5 text-xs font-bold ${
                        activeSong.massSuitability === 'LITURGICO'
                          ? 'bg-sky-100 text-sky-900'
                          : 'bg-orange-100 text-orange-900'
                      }`}
                    >
                      {activeSong.massSuitability === 'LITURGICO'
                        ? 'Apropiado para Misa: Litúrgico'
                        : 'No litúrgico'}
                    </span>
                  </div>

                  <p className="text-sm text-stone-600">
                    Autor: <strong className="text-stone-800">{activeSong.author}</strong>{' '}
                    • Subido por{' '}
                    <strong className="text-stone-800">
                      {activeSong.choir.name}
                    </strong>
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {LITURGICAL_SEASONS_ORDERED.filter((s) =>
                      activeSong.liturgicalSeasons.includes(s.id)
                    ).map((season) => (
                      <span
                        key={season.id}
                        className={`rounded-lg border px-2.5 py-0.5 text-xs font-bold ${season.badgeBg} ${season.badgeText} ${season.badgeBorder}`}
                      >
                        Tiempo: {season.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Controles Exclusivos del Director Dueño del Canto */}
                {canManageActiveSong && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleSongPublic(activeSong)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                        activeSong.isPublic
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                          : 'border-stone-300 bg-stone-100 text-stone-800 hover:bg-stone-200'
                      }`}
                      title="Cambiar visibilidad para otros coros"
                    >
                      {activeSong.isPublic ? (
                        <>
                          <Globe2 className="h-3.5 w-3.5 text-emerald-600" />
                          Público para otros coros
                        </>
                      ) : (
                        <>
                          <Lock className="h-3.5 w-3.5 text-stone-600" />
                          Privado (Hacer público)
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingSong(activeSong);
                        setShowSongModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-700"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteSong(activeSong)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Visor Interactivo de Letra y Acordes */}
              <ChordSheetViewer
                lyricsAndChords={activeSong.lyricsAndChords}
                baseKey={activeSong.baseKey}
              />
            </div>
          ) : (
            <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center space-y-3">
              <BookOpen className="h-10 w-10 text-stone-400 mx-auto" />
              <h3 className="text-lg font-bold text-stone-800">
                Selecciona un canto del repertorio
              </h3>
              <p className="text-sm text-stone-500 max-w-md mx-auto">
                Elige cualquier canto de la lista izquierda para visualizar su
                letra y acordes interactivos.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Subida / Edición de Canto para el Director */}
      {showSongModal && (
        <SongFormModal
          initialSong={editingSong}
          choirName={user.choirName}
          onClose={() => {
            setShowSongModal(false);
            setEditingSong(null);
          }}
          onSave={handleSaveSong}
        />
      )}
    </div>
  );
};
