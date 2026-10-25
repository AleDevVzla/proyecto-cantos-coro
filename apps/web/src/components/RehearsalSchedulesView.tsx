import React, { useState, useEffect } from 'react';
import {
  REHEARSAL_BLOCK_TYPES,
  type RehearsalBlockType,
} from '@cantos/shared';
import {
  api,
  type RehearsalScheduleDTO,
  type SongDTO,
} from '../lib/api';
import { ChordSheetViewer } from './ChordSheetViewer';
import {
  ClipboardList,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  Music,
  Trash2,
  Target,
  PlusCircle,
  X,
} from 'lucide-react';

interface RehearsalSchedulesViewProps {
  rehearsals: RehearsalScheduleDTO[];
  songs: SongDTO[];
  isDirector: boolean;
  initialSelectedId?: string | null;
  onRefresh: () => Promise<void>;
}

interface EditableRehearsalBlock {
  title: string;
  blockType: RehearsalBlockType;
  durationMinutes: number;
  detailedNotes: string;
  songIds: string[];
}

export const RehearsalSchedulesView: React.FC<RehearsalSchedulesViewProps> = ({
  rehearsals,
  songs,
  isDirector,
  initialSelectedId,
  onRefresh,
}) => {
  const [selectedRehearsal, setSelectedRehearsal] =
    useState<RehearsalScheduleDTO | null>(rehearsals[0] || null);
  const [previewSong, setPreviewSong] = useState<SongDTO | null>(null);

  // Modal de creación de ensayo
  const [showNewModal, setShowNewModal] = useState(false);
  const [title, setTitle] = useState('Ensayo Semanal del Coro');
  const [dateStr, setDateStr] = useState('2026-10-31T17:00');
  const [location, setLocation] = useState('Salón Parroquial');
  const [generalObjective, setGeneralObjective] = useState('');
  const [blocks, setBlocks] = useState<EditableRehearsalBlock[]>([
    {
      title: 'Oración Inicial y Afinación',
      blockType: 'ORACION',
      durationMinutes: 10,
      detailedNotes: 'Oración comunitaria y afinación de instrumentos.',
      songIds: [],
    },
    {
      title: 'Técnica Vocal y Calentamiento',
      blockType: 'VOCALIZACION',
      durationMinutes: 15,
      detailedNotes: 'Ejercicios de respiración y vocalización por cuerdas.',
      songIds: [],
    },
    {
      title: 'Estudio de Cantos Nuevos y Voces',
      blockType: 'PRACTICA_CANTO',
      durationMinutes: 35,
      detailedNotes:
        'Practicar estrofas, entradas de segundas voces y cortes rítmicos.',
      songIds: [],
    },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialSelectedId) {
      const found = rehearsals.find((r) => r.id === initialSelectedId);
      if (found) setSelectedRehearsal(found);
    } else if (!selectedRehearsal && rehearsals.length > 0) {
      setSelectedRehearsal(rehearsals[0]);
    } else if (selectedRehearsal) {
      const updated = rehearsals.find((r) => r.id === selectedRehearsal.id);
      if (updated) setSelectedRehearsal(updated);
    }
  }, [rehearsals, initialSelectedId]);

  const handleToggleBlock = async (blockId: string) => {
    if (!isDirector || !selectedRehearsal) return;
    await api.toggleRehearsalBlock(selectedRehearsal.id, blockId);
    await onRefresh();
  };

  const handleCreateRehearsal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.createRehearsalSchedule({
        title,
        date: new Date(dateStr).toISOString(),
        location,
        generalObjective,
        blocks,
      });
      setSelectedRehearsal(res.rehearsal);
      setShowNewModal(false);
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRehearsal = async (id: string) => {
    if (!window.confirm('¿Eliminar este cronograma de ensayo?')) return;
    await api.deleteRehearsalSchedule(id);
    setSelectedRehearsal(null);
    await onRefresh();
  };

  const totalMinutes =
    selectedRehearsal?.blocks.reduce((acc, b) => acc + b.durationMinutes, 0) ||
    0;
  const completedBlocks =
    selectedRehearsal?.blocks.filter((b) => b.isCompleted).length || 0;
  const totalBlocks = selectedRehearsal?.blocks.length || 0;
  const progressPct =
    totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 flex items-center justify-center">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900">
              Cronogramas de Ensayo ("Saber qué se hará a cabalidad")
            </h2>
            <p className="text-xs text-stone-500">
              Planificación detallada bloque por bloque con tiempos, objetivos,
              instrucciones técnicas y cantos a practicar.
            </p>
          </div>
        </div>

        {isDirector && (
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            Planificar Nuevo Ensayo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lista de Ensayos */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 px-1">
            Ensayos Programados ({rehearsals.length})
          </h3>
          {rehearsals.map((reh) => {
            const active = selectedRehearsal?.id === reh.id;
            const mins = reh.blocks.reduce(
              (acc, b) => acc + b.durationMinutes,
              0
            );

            return (
              <button
                key={reh.id}
                type="button"
                onClick={() => setSelectedRehearsal(reh)}
                className={`w-full text-left rounded-2xl border p-4 transition shadow-sm ${
                  active
                    ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <h4 className="font-bold text-stone-900 text-sm">
                  {reh.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                  <span>
                    {new Date(reh.date).toLocaleDateString('es-ES', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <span>• {mins} min totales</span>
                  <span>• {reh.blocks.length} bloques</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detalle Exhaustivo del Ensayo */}
        <div className="lg:col-span-8">
          {selectedRehearsal ? (
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-4">
                <div className="space-y-1.5">
                  <h3 className="text-2xl font-bold text-stone-900">
                    {selectedRehearsal.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600">
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                      <Clock className="h-4 w-4 text-emerald-600" />
                      Duración total: {totalMinutes} minutos
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      {selectedRehearsal.location}
                    </span>
                  </div>
                </div>

                {isDirector && (
                  <button
                    type="button"
                    onClick={() => handleDeleteRehearsal(selectedRehearsal.id)}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Objetivo General del Ensayo + Barra de Progreso */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900">
                    <Target className="h-4 w-4 text-emerald-700" />
                    Objetivo General del Ensayo
                  </div>
                  <span className="rounded-lg bg-emerald-700 text-white px-2.5 py-0.5 text-xs font-bold">
                    Avance: {completedBlocks}/{totalBlocks} bloques ({progressPct}%)
                  </span>
                </div>
                <p className="text-sm text-emerald-950 font-medium leading-relaxed">
                  {selectedRehearsal.generalObjective}
                </p>
                <div className="h-2 w-full rounded-full bg-emerald-200/80 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Línea de Tiempo de Bloques del Ensayo */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Desglose de Actividades a Cabalidad ({selectedRehearsal.blocks.length} bloques)
                </h4>

                {selectedRehearsal.blocks.map((block, idx) => {
                  const typeMeta =
                    REHEARSAL_BLOCK_TYPES.find(
                      (t) => t.id === block.blockType
                    ) || REHEARSAL_BLOCK_TYPES[2];

                  return (
                    <div
                      key={block.id}
                      className={`rounded-2xl border p-5 transition space-y-3 ${
                        block.isCompleted
                          ? 'border-emerald-300 bg-emerald-50/30'
                          : 'border-stone-200 bg-white'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            disabled={!isDirector}
                            onClick={() => handleToggleBlock(block.id)}
                            className={`mt-0.5 transition ${
                              isDirector
                                ? 'cursor-pointer hover:scale-110'
                                : 'cursor-default'
                            }`}
                            title={
                              isDirector
                                ? 'Marcar bloque como completado / pendiente'
                                : 'Estado del bloque'
                            }
                          >
                            {block.isCompleted ? (
                              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            ) : (
                              <Circle className="h-6 w-6 text-stone-400" />
                            )}
                          </button>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-mono font-bold text-stone-500">
                                BLOQUE 0{idx + 1}
                              </span>
                              <span
                                className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${typeMeta.badgeClass}`}
                              >
                                {typeMeta.label}
                              </span>
                            </div>
                            <h5
                              className={`text-base font-bold mt-1 ${
                                block.isCompleted
                                  ? 'line-through text-stone-500'
                                  : 'text-stone-900'
                              }`}
                            >
                              {block.title}
                            </h5>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 rounded-xl bg-stone-900 text-amber-300 px-3 py-1 text-xs font-mono font-bold">
                          <Clock className="h-3.5 w-3.5" />
                          {block.durationMinutes} min
                        </span>
                      </div>

                      <div className="pl-9 space-y-3">
                        <p className="text-sm text-stone-700 leading-relaxed bg-stone-50 rounded-xl p-3 border border-stone-200/80">
                          {block.detailedNotes}
                        </p>

                        {block.songs.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                              Cantos a practicar en este bloque (Clic para ver Letra y Acordes):
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {block.songs.map((bs) => (
                                <button
                                  key={bs.id}
                                  type="button"
                                  onClick={() => setPreviewSong(bs.song)}
                                  className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-950 transition shadow-sm"
                                >
                                  <Music className="h-3.5 w-3.5 text-amber-700" />
                                  {bs.song.title} ({bs.song.baseKey})
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center text-sm text-stone-500">
              Selecciona un ensayo para ver su planificación detallada.
            </div>
          )}
        </div>
      </div>

      {/* Modal para Ver Letra y Acordes de un Canto desde el Ensayo */}
      {previewSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 my-auto max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <span className="text-xs font-bold uppercase text-amber-700">
                  Canto en Práctica de Ensayo
                </span>
                <h3 className="text-xl font-bold text-stone-900">
                  {previewSong.title} — {previewSong.author}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewSong(null)}
                className="rounded-xl p-2 text-stone-500 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ChordSheetViewer
              lyricsAndChords={previewSong.lyricsAndChords}
              baseKey={previewSong.baseKey}
            />
          </div>
        </div>
      )}

      {/* Modal para Crear Nuevo Cronograma de Ensayo */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 my-auto max-h-[92vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold text-stone-900">
                Planificar Nuevo Cronograma de Ensayo
              </h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-xs font-bold text-stone-500"
              >
                Cerrar ✕
              </button>
            </div>

            <form onSubmit={handleCreateRehearsal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase text-stone-600">
                    Título del Ensayo *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
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
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase text-stone-600">
                    Lugar
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-stone-600">
                  Objetivo General del Ensayo *
                </label>
                <textarea
                  rows={2}
                  required
                  value={generalObjective}
                  onChange={(e) => setGeneralObjective(e.target.value)}
                  placeholder="Describe qué se logrará al finalizar este ensayo..."
                  className="w-full rounded-xl border border-stone-300 p-3 text-sm"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase text-stone-600">
                    Bloques de Actividad del Ensayo
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setBlocks((prev) => [
                        ...prev,
                        {
                          title: 'Nuevo Bloque de Práctica',
                          blockType: 'PRACTICA_CANTO',
                          durationMinutes: 20,
                          detailedNotes:
                            'Instrucciones detalladas de lo que se practicará...',
                          songIds: [],
                        },
                      ])
                    }
                    className="inline-flex items-center gap-1 rounded-xl bg-stone-100 hover:bg-stone-200 px-3 py-1 text-xs font-bold text-stone-800"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> Añadir Bloque
                  </button>
                </div>

                {blocks.map((b, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          required
                          value={b.title}
                          onChange={(e) => {
                            const next = [...blocks];
                            next[idx].title = e.target.value;
                            setBlocks(next);
                          }}
                          placeholder="Título del bloque..."
                          className="w-full rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <select
                          value={b.blockType}
                          onChange={(e) => {
                            const next = [...blocks];
                            next[idx].blockType = e.target
                              .value as RehearsalBlockType;
                            setBlocks(next);
                          }}
                          className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold"
                        >
                          {REHEARSAL_BLOCK_TYPES.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-3 flex items-center gap-2">
                        <input
                          type="number"
                          min={5}
                          max={180}
                          value={b.durationMinutes}
                          onChange={(e) => {
                            const next = [...blocks];
                            next[idx].durationMinutes =
                              Number(e.target.value) || 15;
                            setBlocks(next);
                          }}
                          className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                        />
                        <span className="text-xs text-stone-500">min</span>
                        <button
                          type="button"
                          onClick={() =>
                            setBlocks(blocks.filter((_, i) => i !== idx))
                          }
                          className="text-rose-600 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      required
                      value={b.detailedNotes}
                      onChange={(e) => {
                        const next = [...blocks];
                        next[idx].detailedNotes = e.target.value;
                        setBlocks(next);
                      }}
                      placeholder="¿Qué se hará a cabalidad en este bloque? (Voces, acordes, ritmo, cortes...)"
                      className="w-full rounded-xl border border-stone-300 bg-white p-2.5 text-xs"
                    />

                    <div>
                      <span className="block text-[11px] font-bold text-stone-500 mb-1">
                        Vincular cantos a este bloque:
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {songs.map((s) => {
                          const checked = b.songIds.includes(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                const next = [...blocks];
                                next[idx].songIds = checked
                                  ? next[idx].songIds.filter(
                                      (id) => id !== s.id
                                    )
                                  : [...next[idx].songIds, s.id];
                                setBlocks(next);
                              }}
                              className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
                                checked
                                  ? 'border-amber-600 bg-amber-100 text-amber-950'
                                  : 'border-stone-200 bg-white text-stone-600'
                              }`}
                            >
                              {s.title}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-bold text-stone-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-bold shadow"
                >
                  {saving ? 'Guardando...' : 'Guardar Cronograma de Ensayo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
