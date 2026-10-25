import React, { useState, useEffect } from 'react';
import {
  COMMON_KEYS,
  LITURGICAL_SEASONS_ORDERED,
  MASS_MOMENTS_ORDERED,
  type LiturgicalSeason,
} from '@cantos/shared';
import {
  api,
  type MassScheduleDTO,
  type SongDTO,
} from '../lib/api';
import { ChordSheetViewer } from './ChordSheetViewer';
import {
  BookOpen,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Music,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  Eye,
  Edit3,
  PlusCircle,
} from 'lucide-react';

interface MassSchedulesViewProps {
  schedules: MassScheduleDTO[];
  songs: SongDTO[];
  isDirector: boolean;
  initialSelectedId?: string | null;
  onRefresh: () => Promise<void>;
}

interface EditableMassItem {
  momentName: string;
  songId: string;
  targetKey: string;
  directorNotes: string;
}

export const MassSchedulesView: React.FC<MassSchedulesViewProps> = ({
  schedules,
  songs,
  isDirector,
  initialSelectedId,
  onRefresh,
}) => {
  const [selectedSchedule, setSelectedSchedule] =
    useState<MassScheduleDTO | null>(schedules[0] || null);
  const [viewMode, setViewMode] = useState<'OVERVIEW' | 'LECTERN_STEP' | 'LECTERN_CONTINUOUS'>(
    'OVERVIEW'
  );
  const [stepIndex, setStepIndex] = useState(0);

  // Modal de Creación / Edición de Cronograma de Misa
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState('2026-11-01T11:00');
  const [season, setSeason] = useState<LiturgicalSeason>('ORDINARIO');
  const [celebrantNotes, setCelebrantNotes] = useState('');
  const [items, setItems] = useState<EditableMassItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialSelectedId) {
      const found = schedules.find((s) => s.id === initialSelectedId);
      if (found) setSelectedSchedule(found);
    } else if (!selectedSchedule && schedules.length > 0) {
      setSelectedSchedule(schedules[0]);
    } else if (selectedSchedule) {
      const updated = schedules.find((s) => s.id === selectedSchedule.id);
      if (updated) setSelectedSchedule(updated);
    }
  }, [schedules, initialSelectedId]);

  const openNewBuilder = () => {
    setEditingId(null);
    setTitle('Misa Dominical');
    setDateStr('2026-11-01T11:00');
    setSeason('ORDINARIO');
    setCelebrantNotes('');
    setItems(
      MASS_MOMENTS_ORDERED.slice(0, 9).map((m) => ({
        momentName: m,
        songId: '',
        targetKey: 'Do',
        directorNotes: '',
      }))
    );
    setShowBuilder(true);
  };

  const openEditBuilder = (sched: MassScheduleDTO) => {
    setEditingId(sched.id);
    setTitle(sched.title);
    setDateStr(sched.date.slice(0, 16));
    setSeason(sched.liturgicalSeason);
    setCelebrantNotes(sched.celebrantNotes || '');
    setItems(
      sched.items.map((it) => ({
        momentName: it.momentName,
        songId: it.songId || '',
        targetKey: it.targetKey || it.song?.baseKey || 'Do',
        directorNotes: it.directorNotes || '',
      }))
    );
    setShowBuilder(true);
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const copy = [...items];
    const [removed] = copy.splice(index, 1);
    copy.splice(target, 0, removed);
    setItems(copy);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title,
        date: new Date(dateStr).toISOString(),
        liturgicalSeason: season,
        celebrantNotes,
        items: items.map((it) => ({
          momentName: it.momentName,
          songId: it.songId || null,
          targetKey: it.targetKey || null,
          directorNotes: it.directorNotes || null,
        })),
      };

      if (editingId) {
        const res = await api.updateMassSchedule(editingId, payload);
        setSelectedSchedule(res.schedule);
      } else {
        const res = await api.createMassSchedule(payload);
        setSelectedSchedule(res.schedule);
      }
      setShowBuilder(false);
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!window.confirm('¿Eliminar este cronograma de misa?')) return;
    await api.deleteMassSchedule(id);
    setSelectedSchedule(null);
    await onRefresh();
  };

  const activeItemsWithSongs =
    selectedSchedule?.items.filter((i) => i.song !== null) || [];

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-700 flex items-center justify-center">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900">
              Cronogramas de Misa (Orden Litúrgico y Acordes)
            </h2>
            <p className="text-xs text-stone-500">
              Estructura el orden exacto de los cantos de una Misa y visualiza
              sus letras y acordes en secuencia durante la celebración.
            </p>
          </div>
        </div>

        {isDirector && (
          <button
            type="button"
            onClick={openNewBuilder}
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            Crear Cronograma de Misa
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lista de Misas Programadas */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 px-1">
            Misas Estructuradas ({schedules.length})
          </h3>
          {schedules.map((sched) => {
            const seasonMeta = LITURGICAL_SEASONS_ORDERED.find(
              (s) => s.id === sched.liturgicalSeason
            );
            const active = selectedSchedule?.id === sched.id;

            return (
              <button
                key={sched.id}
                type="button"
                onClick={() => {
                  setSelectedSchedule(sched);
                  setStepIndex(0);
                }}
                className={`w-full text-left rounded-2xl border p-4 transition shadow-sm ${
                  active
                    ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-500/20'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-stone-900 text-sm">
                    {sched.title}
                  </h4>
                  {seasonMeta && (
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${seasonMeta.badgeBg} ${seasonMeta.badgeText} ${seasonMeta.badgeBorder}`}
                    >
                      {seasonMeta.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  {new Date(sched.date).toLocaleDateString('es-ES', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  • {sched.items.length} momentos litúrgicos
                </p>
              </button>
            );
          })}
        </div>

        {/* Detalle del Cronograma de Misa y Modo Atril */}
        <div className="lg:col-span-8">
          {selectedSchedule ? (
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-6">
              {/* Encabezado y Selector de Modo de Vista */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-4">
                <div>
                  <h3 className="text-2xl font-bold text-stone-900">
                    {selectedSchedule.title}
                  </h3>
                  {selectedSchedule.celebrantNotes && (
                    <p className="text-xs text-stone-600 mt-1">
                      {selectedSchedule.celebrantNotes}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Modos de Lectura */}
                  <div className="flex rounded-xl border border-stone-200 bg-stone-100 p-1">
                    <button
                      type="button"
                      onClick={() => setViewMode('OVERVIEW')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        viewMode === 'OVERVIEW'
                          ? 'bg-white text-stone-900 shadow-sm'
                          : 'text-stone-600'
                      }`}
                    >
                      <ListOrdered className="h-3.5 w-3.5 inline mr-1" />
                      Orden
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStepIndex(0);
                        setViewMode('LECTERN_STEP');
                      }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        viewMode === 'LECTERN_STEP'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-stone-600'
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5 inline mr-1" />
                      Atril Paso a Paso
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('LECTERN_CONTINUOUS')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        viewMode === 'LECTERN_CONTINUOUS'
                          ? 'bg-stone-900 text-amber-300 shadow-sm'
                          : 'text-stone-600'
                      }`}
                    >
                      Vista Continua (Toda la Misa)
                    </button>
                  </div>

                  {isDirector && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditBuilder(selectedSchedule)}
                        className="rounded-xl border border-stone-300 px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-50 inline-flex items-center gap-1"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Editar Orden
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteSchedule(selectedSchedule.id)
                        }
                        className="rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* VISTA 1: Resumen Estructurado del Orden de la Misa */}
              {viewMode === 'OVERVIEW' && (
                <div className="space-y-3">
                  {selectedSchedule.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-stone-200 bg-stone-50/60 p-4 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <span className="h-8 w-8 rounded-xl bg-stone-900 text-amber-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                              {item.momentName}
                            </span>
                            {item.targetKey && (
                              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-mono font-bold text-amber-900">
                                Tono en Misa: {item.targetKey}
                              </span>
                            )}
                          </div>
                          {item.song ? (
                            <div className="text-base font-bold text-stone-900 mt-0.5">
                              {item.song.title}{' '}
                              <span className="text-xs font-normal text-stone-500">
                                ({item.song.author})
                              </span>
                            </div>
                          ) : (
                            <div className="text-xs italic text-stone-400 mt-0.5">
                              Sin canto asignado para este momento
                            </div>
                          )}
                          {item.directorNotes && (
                            <p className="text-xs text-stone-600 mt-1">
                              📌 <strong>Indicación:</strong> {item.directorNotes}
                            </p>
                          )}
                        </div>
                      </div>

                      {item.song && (
                        <button
                          type="button"
                          onClick={() => {
                            const songIdx = activeItemsWithSongs.findIndex(
                              (x) => x.id === item.id
                            );
                            setStepIndex(songIdx >= 0 ? songIdx : 0);
                            setViewMode('LECTERN_STEP');
                          }}
                          className="rounded-xl bg-white border border-stone-300 hover:border-amber-500 px-3.5 py-2 text-xs font-bold text-stone-800 shadow-sm transition inline-flex items-center gap-1.5"
                        >
                          <Music className="h-3.5 w-3.5 text-amber-600" />
                          Ver Letra y Acordes
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* VISTA 2: Modo Atril Paso a Paso (Anterior / Siguiente Canto) */}
              {viewMode === 'LECTERN_STEP' && (
                <div className="space-y-4">
                  {activeItemsWithSongs.length === 0 ? (
                    <p className="text-sm text-stone-500">
                      No hay cantos asignados en este cronograma.
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-stone-900 text-white p-4">
                        <button
                          type="button"
                          disabled={stepIndex === 0}
                          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 px-3.5 py-2 text-xs font-bold"
                        >
                          <ChevronLeft className="h-4 w-4" /> Anterior Canto
                        </button>

                        <div className="text-center">
                          <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                            {stepIndex + 1} de {activeItemsWithSongs.length} •{' '}
                            {activeItemsWithSongs[stepIndex].momentName}
                          </div>
                          <div className="text-base font-bold">
                            {activeItemsWithSongs[stepIndex].song?.title}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={
                            stepIndex >= activeItemsWithSongs.length - 1
                          }
                          onClick={() =>
                            setStepIndex((i) =>
                              Math.min(activeItemsWithSongs.length - 1, i + 1)
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 disabled:opacity-40 px-3.5 py-2 text-xs font-bold"
                        >
                          Siguiente Canto <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      {activeItemsWithSongs[stepIndex].directorNotes && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-950">
                          <strong>Nota del Director para este momento:</strong>{' '}
                          {activeItemsWithSongs[stepIndex].directorNotes}
                        </div>
                      )}

                      {activeItemsWithSongs[stepIndex].song && (
                        <ChordSheetViewer
                          lyricsAndChords={
                            activeItemsWithSongs[stepIndex].song!.lyricsAndChords
                          }
                          baseKey={
                            activeItemsWithSongs[stepIndex].song!.baseKey
                          }
                          targetKeyOverride={
                            activeItemsWithSongs[stepIndex].targetKey
                          }
                        />
                      )}
                    </>
                  )}
                </div>
              )}

              {/* VISTA 3: Lectura Continua de Toda la Misa */}
              {viewMode === 'LECTERN_CONTINUOUS' && (
                <div className="space-y-8">
                  {activeItemsWithSongs.map((item, idx) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-stone-200 p-5 space-y-3 bg-stone-50/40"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                            {idx + 1}. {item.momentName}
                          </span>
                          <h4 className="text-xl font-bold text-stone-900">
                            {item.song?.title}
                          </h4>
                        </div>
                        <span className="rounded-xl bg-stone-900 text-amber-300 px-3 py-1 text-xs font-mono font-bold">
                          Tono Misa: {item.targetKey || item.song?.baseKey}
                        </span>
                      </div>
                      {item.directorNotes && (
                        <p className="text-xs text-stone-600">
                          📌 <strong>Nota del Director:</strong>{' '}
                          {item.directorNotes}
                        </p>
                      )}
                      {item.song && (
                        <ChordSheetViewer
                          lyricsAndChords={item.song.lyricsAndChords}
                          baseKey={item.song.baseKey}
                          targetKeyOverride={item.targetKey}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center text-sm text-stone-500">
              Selecciona o crea un cronograma de misa.
            </div>
          )}
        </div>
      </div>

      {/* Modal Constructor de Cronograma de Misa */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 my-auto max-h-[92vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <h3 className="text-lg font-bold text-stone-900">
                {editingId
                  ? 'Editar Cronograma de Misa'
                  : 'Nuevo Cronograma de Misa'}
              </h3>
              <button
                type="button"
                onClick={() => setShowBuilder(false)}
                className="text-xs font-bold text-stone-500 hover:text-stone-900"
              >
                Cerrar ✕
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-5 space-y-1">
                  <label className="block text-xs font-bold uppercase text-stone-600">
                    Título de la Celebración *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-4 space-y-1">
                  <label className="block text-xs font-bold uppercase text-stone-600">
                    Fecha y Hora *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-3 space-y-1">
                  <label className="block text-xs font-bold uppercase text-stone-600">
                    Tiempo Litúrgico
                  </label>
                  <select
                    value={season}
                    onChange={(e) =>
                      setSeason(e.target.value as LiturgicalSeason)
                    }
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-bold"
                  >
                    {LITURGICAL_SEASONS_ORDERED.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(season === 'CUARESMA' || season === 'ADVIENTO') && (
                <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-xs text-purple-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-purple-700" />
                  <span>
                    <strong>Nota Litúrgica ({season}):</strong> Recuerda que en
                    Cuaresma y Adviento habitualmente se omite el Gloria (salvo
                    solemnidades/fiestas) y en Cuaresma se sustituye el Aleluya
                    por la aclamación antes del Evangelio.
                  </span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-stone-600">
                  Notas Generales de la Misa
                </label>
                <input
                  type="text"
                  value={celebrantNotes}
                  onChange={(e) => setCelebrantNotes(e.target.value)}
                  placeholder="Celebrante, intención especial o indicación general..."
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm"
                />
              </div>

              {/* Bloques ordenables de cantos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
                    Estructura y Orden de Cantos en la Misa
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setItems((prev) => [
                        ...prev,
                        {
                          momentName: 'Comunión (2do Canto)',
                          songId: '',
                          targetKey: 'Do',
                          directorNotes: '',
                        },
                      ])
                    }
                    className="inline-flex items-center gap-1 rounded-xl bg-stone-100 hover:bg-stone-200 px-3 py-1 text-xs font-bold text-stone-800"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> Añadir Momento
                  </button>
                </div>

                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-stone-200 bg-stone-50 p-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                  >
                    <div className="md:col-span-3 flex items-center gap-2">
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveItem(idx, -1)}
                          className="rounded bg-white border border-stone-200 p-0.5 hover:bg-stone-100"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(idx, 1)}
                          className="rounded bg-white border border-stone-200 p-0.5 hover:bg-stone-100"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.momentName}
                        onChange={(e) => {
                          const next = [...items];
                          next[idx].momentName = e.target.value;
                          setItems(next);
                        }}
                        className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <select
                        value={item.songId}
                        onChange={(e) => {
                          const sid = e.target.value;
                          const foundSong = songs.find((s) => s.id === sid);
                          const next = [...items];
                          next[idx].songId = sid;
                          if (foundSong) next[idx].targetKey = foundSong.baseKey;
                          setItems(next);
                        }}
                        className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs"
                      >
                        <option value="">-- Seleccionar Canto --</option>
                        {songs.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title} ({s.baseKey}) — {s.choir.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <select
                        value={item.targetKey}
                        onChange={(e) => {
                          const next = [...items];
                          next[idx].targetKey = e.target.value;
                          setItems(next);
                        }}
                        className="w-full rounded-xl border border-stone-300 bg-white px-2 py-1.5 text-xs font-bold text-amber-900"
                      >
                        {COMMON_KEYS.map((k) => (
                          <option key={k} value={k}>
                            Tono: {k}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-3 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={item.directorNotes}
                        onChange={(e) => {
                          const next = [...items];
                          next[idx].directorNotes = e.target.value;
                          setItems(next);
                        }}
                        placeholder="Notas (ej. Canta solista)..."
                        className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setItems(items.filter((_, i) => i !== idx))
                        }
                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowBuilder(false)}
                  className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-bold text-stone-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 text-xs font-bold shadow"
                >
                  {saving ? 'Guardando...' : 'Guardar Cronograma de Misa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
