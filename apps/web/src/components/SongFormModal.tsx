import React, { useState } from 'react';
import {
  COMMON_KEYS,
  LITURGICAL_SEASONS_ORDERED,
  MASS_SUITABILITY_OPTIONS,
  type LiturgicalSeason,
  type MassSuitability,
} from '@cantos/shared';
import type { CreateOrUpdateSongInput, SongDTO } from '../lib/api';
import { ChordSheetViewer } from './ChordSheetViewer';
import {
  X,
  Globe2,
  Lock,
  Music,
  Check,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface SongFormModalProps {
  initialSong?: SongDTO | null;
  choirName: string;
  onClose: () => void;
  onSave: (data: CreateOrUpdateSongInput) => Promise<void>;
}

const QUICK_CHORDS = [
  '[Do]',
  '[Re]',
  '[Mi]',
  '[Fa]',
  '[Sol]',
  '[La]',
  '[Si]',
  '[Lam]',
  '[Mim]',
  '[Rem]',
  '[Sim]',
  '[Fa#m]',
  '{CORO}',
  '{ESTROFA 1}',
];

export const SongFormModal: React.FC<SongFormModalProps> = ({
  initialSong,
  choirName,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(initialSong?.title || '');
  const [author, setAuthor] = useState(initialSong?.author || '');
  const [baseKey, setBaseKey] = useState(initialSong?.baseKey || 'Do');
  const [liturgicalSeasons, setLiturgicalSeasons] = useState<
    LiturgicalSeason[]
  >(initialSong?.liturgicalSeasons || ['ORDINARIO']);
  const [massSuitability, setMassSuitability] = useState<MassSuitability>(
    initialSong?.massSuitability || 'LITURGICO'
  );
  const [isPublic, setIsPublic] = useState<boolean>(
    initialSong ? initialSong.isPublic : true
  );
  const [lyricsAndChords, setLyricsAndChords] = useState(
    initialSong?.lyricsAndChords ||
      `{CORO}\n[Do]Santo, [Sol]Santo, [Lam]Santo es el Se[Fa]ñor,\n[Do]Dios del uni[Sol]verso.[Do]\n\n{ESTROFA 1}\n[Fa]Llenos están el [Do]cielo y la [Sol]tierra de tu [Do]gloria.`
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSeason = (season: LiturgicalSeason) => {
    setLiturgicalSeasons((prev) =>
      prev.includes(season)
        ? prev.length > 1
          ? prev.filter((s) => s !== season)
          : prev
        : [...prev, season]
    );
  };

  const insertSnippet = (snippet: string) => {
    setLyricsAndChords((prev) => `${prev}${snippet}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSave({
        title,
        author,
        baseKey,
        lyricsAndChords,
        liturgicalSeasons,
        massSuitability,
        isPublic,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el canto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-6xl rounded-3xl bg-white shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-900 text-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
              <Music className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {initialSong
                  ? 'Editar Canto del Repertorio'
                  : 'Subir Nuevo Canto al Repertorio'}
              </h2>
              <p className="text-xs text-stone-300">
                Estudio del Director • {choirName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-stone-400 hover:bg-stone-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido en 2 columnas: Formulario + Vista Previa en Vivo */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          <div className="lg:col-span-7 space-y-5">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 font-medium">
                {error}
              </div>
            )}

            {/* Título, Autor y Tonalidad */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-6 space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Título del Canto *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Pescador de Hombres"
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-4 space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Autor / Comunidad
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Ej. Cesáreo Gabaráin"
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Tono Base
                </label>
                <select
                  value={baseKey}
                  onChange={(e) => setBaseKey(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-2 text-sm font-bold text-amber-800 focus:border-amber-600 focus:outline-none"
                >
                  {COMMON_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 1. División por Tiempo en el Año (Orden estricto: Ordinario - Cuaresma - Pascua - Adviento - Navidad) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                Tiempo en el Año (Orden Litúrgico: Ordinario • Cuaresma • Pascua • Adviento • Navidad)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {LITURGICAL_SEASONS_ORDERED.map((season, index) => {
                  const selected = liturgicalSeasons.includes(season.id);
                  return (
                    <button
                      key={season.id}
                      type="button"
                      onClick={() => toggleSeason(season.id)}
                      className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
                        selected
                          ? `${season.badgeBg} ${season.badgeBorder} ${season.badgeText} ring-2 ring-amber-500/30`
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-[10px] font-bold opacity-70">
                          0{index + 1}
                        </span>
                        {selected && <Check className="h-3.5 w-3.5" />}
                      </div>
                      <span className="text-xs font-bold mt-0.5">
                        {season.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Apropiado para una Misa + 3. Visibilidad Público/Privado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Apropiado para una Misa
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {MASS_SUITABILITY_OPTIONS.map((opt) => {
                    const active = massSuitability === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setMassSuitability(opt.id)}
                        className={`rounded-xl border p-3 text-left transition ${
                          active
                            ? 'border-amber-600 bg-amber-50 text-amber-950 font-semibold'
                            : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <div className="text-xs font-bold">{opt.label}</div>
                        <div className="text-[11px] opacity-75 mt-0.5 line-clamp-1">
                          {opt.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Visibilidad para los demás Coros
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`rounded-xl border p-3 text-left transition ${
                      isPublic
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Globe2 className="h-4 w-4 text-emerald-600" />
                      Público
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      Visible para otros coros
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`rounded-xl border p-3 text-left transition ${
                      !isPublic
                        ? 'border-stone-800 bg-stone-100 text-stone-900'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Lock className="h-4 w-4 text-stone-700" />
                      Privado
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      Solo para mi coro
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Editor de Letra y Acordes */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Letra y Acordes (Escribe acordes entre corchetes ej: [Do]Santo)
                </label>
                <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Inserción rápida:
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 pb-1">
                {QUICK_CHORDS.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => insertSnippet(ch)}
                    className="rounded-lg border border-stone-300 bg-stone-50 hover:bg-amber-50 hover:border-amber-400 px-2 py-1 text-xs font-mono font-semibold text-stone-700 transition"
                  >
                    {ch}
                  </button>
                ))}
              </div>

              <textarea
                rows={10}
                required
                value={lyricsAndChords}
                onChange={(e) => setLyricsAndChords(e.target.value)}
                className="w-full rounded-2xl border border-stone-300 p-4 font-mono text-sm leading-relaxed focus:border-amber-600 focus:outline-none"
                placeholder="Escribe la letra con sus acordes entre corchetes..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition"
              >
                {saving
                  ? 'Guardando...'
                  : initialSong
                  ? 'Guardar Cambios'
                  : 'Publicar Canto en el Repertorio'}
              </button>
            </div>
          </div>

          {/* Columna Derecha: Vista Previa en Vivo */}
          <div className="lg:col-span-5 flex flex-col rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-600">
                <BookOpen className="h-4 w-4 text-amber-600" />
                Vista Previa en Vivo (Letra y Acordes)
              </div>
              <span className="rounded-lg bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                Tono: {baseKey}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[460px]">
              <ChordSheetViewer
                lyricsAndChords={lyricsAndChords}
                baseKey={baseKey}
                compact
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
