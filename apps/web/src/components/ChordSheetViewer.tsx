import React, { useState } from 'react';
import {
  parseChordProText,
  transposeSingleChord,
  type ChordNotation,
} from '@cantos/shared';
import {
  Music,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Sun,
  Moon,
  RotateCcw,
  Type,
} from 'lucide-react';

interface ChordSheetViewerProps {
  lyricsAndChords: string;
  baseKey: string;
  compact?: boolean;
}

export const ChordSheetViewer: React.FC<ChordSheetViewerProps> = ({
  lyricsAndChords,
  baseKey,
  compact = false,
}) => {
  const [semitones, setSemitones] = useState(0);
  const [notation, setNotation] = useState<ChordNotation>('LATIN');
  const [showChords, setShowChords] = useState(true);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [darkMode, setDarkMode] = useState(false);

  const lines = parseChordProText(lyricsAndChords, semitones, notation);
  const currentKey = transposeSingleChord(baseKey, semitones, notation);

  const fontSizeClasses = {
    sm: { chord: 'text-xs', lyric: 'text-sm' },
    base: { chord: 'text-sm', lyric: 'text-base' },
    lg: { chord: 'text-base', lyric: 'text-lg' },
    xl: { chord: 'text-lg', lyric: 'text-xl' },
  }[fontSize];

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-100/80 p-3">
          {/* Transpositor de Tono */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-600">
              <Music className="h-4 w-4 text-amber-600" />
              Tono:
            </span>
            <span className="inline-flex min-w-[3.2rem] items-center justify-center rounded-lg bg-amber-600 px-2.5 py-1 text-sm font-bold text-white shadow-sm">
              {currentKey}
            </span>
            <div className="flex items-center rounded-lg border border-stone-300 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setSemitones((s) => s - 1)}
                title="Bajar medio tono (-1 semitono)"
                className="px-2.5 py-1 text-xs font-bold text-stone-700 hover:bg-stone-100"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="border-x border-stone-200 px-2 py-1 text-xs font-medium text-stone-600">
                {semitones > 0 ? `+${semitones}` : semitones}
              </span>
              <button
                type="button"
                onClick={() => setSemitones((s) => s + 1)}
                title="Subir medio tono (+1 semitono)"
                className="px-2.5 py-1 text-xs font-bold text-stone-700 hover:bg-stone-100"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            {semitones !== 0 && (
              <button
                type="button"
                onClick={() => setSemitones(0)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-200"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Original ({baseKey})
              </button>
            )}
          </div>

          {/* Controles de Notación, Acordes, Fuente y Modo Atril */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setNotation((n) => (n === 'LATIN' ? 'AMERICAN' : 'LATIN'))
              }
              className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50"
            >
              {notation === 'LATIN' ? 'Notación: Do, Re, Mi' : 'Notación: C, D, E'}
            </button>

            <button
              type="button"
              onClick={() => setShowChords((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-sm transition ${
                showChords
                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                  : 'border-stone-300 bg-white text-stone-600'
              }`}
            >
              {showChords ? (
                <>
                  <Eye className="h-3.5 w-3.5" /> Con Acordes
                </>
              ) : (
                <>
                  <EyeOff className="h-3.5 w-3.5" /> Solo Letra
                </>
              )}
            </button>

            <div className="flex items-center rounded-lg border border-stone-300 bg-white shadow-sm">
              <span className="pl-2 text-stone-400">
                <Type className="h-3.5 w-3.5" />
              </span>
              {(['sm', 'base', 'lg', 'xl'] as const).map((sz, i) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setFontSize(sz)}
                  className={`px-2 py-1 text-xs font-semibold ${
                    fontSize === sz
                      ? 'bg-stone-800 text-white'
                      : 'text-stone-600 hover:bg-stone-100'
                  } ${i === 3 ? 'rounded-r-lg' : ''}`}
                >
                  A{i > 1 ? '+' : i === 0 ? '-' : ''}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              title="Modo Atril Oscuro / Claro"
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-sm ${
                darkMode
                  ? 'border-stone-700 bg-stone-900 text-amber-400'
                  : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              {darkMode ? (
                <>
                  <Sun className="h-3.5 w-3.5" /> Claro
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5" /> Modo Atril
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Lienzo de Letra y Acordes */}
      <div
        className={`rounded-2xl border p-6 transition-colors ${
          darkMode
            ? 'border-stone-800 bg-stone-950 text-stone-100'
            : 'border-stone-200 bg-white text-stone-800'
        }`}
      >
        <div className="space-y-2.5">
          {lines.map((line, lineIdx) => {
            if (line.isEmpty) {
              return <div key={lineIdx} className="h-4" />;
            }

            if (line.isSectionHeader) {
              return (
                <div key={lineIdx} className="pt-3 pb-1">
                  <span
                    className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase ${
                      darkMode
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                        : 'bg-amber-100/80 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {line.sectionTitle}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={lineIdx}
                className="flex flex-wrap items-end leading-relaxed"
              >
                {line.segments.map((seg, segIdx) => (
                  <span
                    key={segIdx}
                    className="inline-flex flex-col justify-end mr-0.5"
                  >
                    {showChords && (
                      <span
                        className={`font-mono font-bold select-none min-h-[1.25em] pr-1.5 ${
                          fontSizeClasses.chord
                        } ${
                          darkMode ? 'text-amber-400' : 'text-amber-700'
                        }`}
                      >
                        {seg.chord || '\u00A0'}
                      </span>
                    )}
                    <span
                      className={`whitespace-pre-wrap font-medium ${fontSizeClasses.lyric}`}
                    >
                      {seg.lyric || (seg.chord ? '\u00A0\u00A0\u00A0' : '')}
                    </span>
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
