// ============================================================================
// CONSTANTES Y DOMINIO LITÚRGICO COMPARTIDO
// ============================================================================

export type Role = 'DIRECTOR' | 'MEMBER';

// Orden estricto solicitado: Ordinario - Cuaresma - Pascua - Adviento - Navidad
export type LiturgicalSeason =
  | 'ORDINARIO'
  | 'CUARESMA'
  | 'PASCUA'
  | 'ADVIENTO'
  | 'NAVIDAD';

export type MassSuitability = 'LITURGICO' | 'NO_LITURGICO';

export interface SeasonMeta {
  id: LiturgicalSeason;
  label: string;
  shortDesc: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentHex: string;
}

/**
 * Lista de tiempos en el año en el ORDEN EXACTO requerido:
 * 1. Ordinario
 * 2. Cuaresma
 * 3. Pascua
 * 4. Adviento
 * 5. Navidad
 */
export const LITURGICAL_SEASONS_ORDERED: SeasonMeta[] = [
  {
    id: 'ORDINARIO',
    label: 'Ordinario',
    shortDesc: 'Tiempo Ordinario',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-300',
    accentHex: '#059669',
  },
  {
    id: 'CUARESMA',
    label: 'Cuaresma',
    shortDesc: 'Conversión y preparación',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-300',
    accentHex: '#7c3aed',
  },
  {
    id: 'PASCUA',
    label: 'Pascua',
    shortDesc: 'Resurrección del Señor',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
    accentHex: '#d97706',
  },
  {
    id: 'ADVIENTO',
    label: 'Adviento',
    shortDesc: 'Espera del Señor',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-300',
    accentHex: '#4f46e5',
  },
  {
    id: 'NAVIDAD',
    label: 'Navidad',
    shortDesc: 'Nacimiento del Señor',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-300',
    accentHex: '#e11d48',
  },
];

export const MASS_SUITABILITY_OPTIONS: {
  id: MassSuitability;
  label: string;
  description: string;
}[] = [
  {
    id: 'LITURGICO',
    label: 'Litúrgico',
    description: 'Apropiado para los ritos de la Santa Misa',
  },
  {
    id: 'NO_LITURGICO',
    label: 'No litúrgico',
    description: 'Canto de animación, adoración, retiro o encuentro',
  },
];

// ============================================================================
// MOTOR DE ACORDES Y LETRA (CHORDPRO + TRANSPOSICIÓN MUSICAL)
// ============================================================================

export type ChordNotation = 'LATIN' | 'AMERICAN';

const LATIN_NOTES = [
  'Do',
  'Do#',
  'Re',
  'Re#',
  'Mi',
  'Fa',
  'Fa#',
  'Sol',
  'Sol#',
  'La',
  'La#',
  'Si',
];

const AMERICAN_NOTES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

const ENHARMONIC_MAP: Record<string, number> = {
  Do: 0,
  'Do#': 1,
  Reb: 1,
  Re: 2,
  'Re#': 3,
  Mib: 3,
  Mi: 4,
  Fa: 5,
  'Fa#': 6,
  Solb: 6,
  Sol: 7,
  'Sol#': 8,
  Lab: 8,
  La: 9,
  'La#': 10,
  Sib: 10,
  Si: 11,
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

const ROOT_REGEX =
  /^(Do#|Reb|Re#|Mib|Fa#|Solb|Sol#|Lab|La#|Sib|Do|Re|Mi|Fa|Sol|La|Si|C#|Db|D#|Eb|F#|Gb|G#|Ab|A#|Bb|C|D|E|F|G|A|B)(.*)$/;

export function transposeSingleChord(
  chord: string,
  semitones: number,
  notation: ChordNotation = 'LATIN'
): string {
  const trimmed = chord.trim();
  if (!trimmed) return trimmed;

  // Handle slash chords e.g. Sol/Si or G/B
  if (trimmed.includes('/')) {
    return trimmed
      .split('/')
      .map((part) => transposeSingleChord(part, semitones, notation))
      .join('/');
  }

  const match = trimmed.match(ROOT_REGEX);
  if (!match) return trimmed;

  const [, root, suffix] = match;
  const baseIndex = ENHARMONIC_MAP[root];
  if (baseIndex === undefined) return trimmed;

  const targetIndex = ((baseIndex + semitones) % 12 + 12) % 12;
  const scale = notation === 'LATIN' ? LATIN_NOTES : AMERICAN_NOTES;

  return `${scale[targetIndex]}${suffix}`;
}

export interface ChordLyricSegment {
  chord: string | null;
  lyric: string;
}

export interface ParsedSongLine {
  isSectionHeader: boolean;
  sectionTitle?: string;
  isEmpty: boolean;
  segments: ChordLyricSegment[];
}

/**
 * Parsea texto con acordes entre corchetes estilo ChordPro:
 * Ejemplo: "[Do]Santo, [Sol]Santo es el Se[Lam]ñor"
 */
export function parseChordProText(
  text: string,
  semitones = 0,
  notation: ChordNotation = 'LATIN'
): ParsedSongLine[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');

  return lines.map((rawLine) => {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      return { isSectionHeader: false, isEmpty: true, segments: [] };
    }

    // Encabezados como {Coro}, [Coro:], --- CORO ---
    if (
      /^\{.*\}$/.test(trimmed) ||
      /^(CORO|ESTROFA|INTRO|FINAL|PUENTE|PRE-CORO|ESTRIBILLO)(\s*\d*)?:?$/i.test(
        trimmed
      )
    ) {
      const cleanTitle = trimmed.replace(/^\{|\}$/g, '').replace(/:$/, '');
      return {
        isSectionHeader: true,
        sectionTitle: cleanTitle.toUpperCase(),
        isEmpty: false,
        segments: [],
      };
    }

    const segments: ChordLyricSegment[] = [];
    const regex = /\[([^\]]+)\]([^\[]*)/g;
    let firstBracketIdx = rawLine.indexOf('[');

    if (firstBracketIdx === -1) {
      segments.push({ chord: null, lyric: rawLine });
      return { isSectionHeader: false, isEmpty: false, segments };
    }

    if (firstBracketIdx > 0) {
      segments.push({
        chord: null,
        lyric: rawLine.slice(0, firstBracketIdx),
      });
    }

    let match: RegExpExecArray | null;
    while ((match = regex.exec(rawLine)) !== null) {
      const rawChord = match[1].trim();
      const lyricPart = match[2] || '';

      // Si el corchete es una indicación como [Coro] o [Estrofa 1]
      if (/^(coro|estrofa|intro|final|puente|bis)/i.test(rawChord)) {
        return {
          isSectionHeader: true,
          sectionTitle: rawChord.toUpperCase(),
          isEmpty: false,
          segments: [],
        };
      }

      segments.push({
        chord: transposeSingleChord(rawChord, semitones, notation),
        lyric: lyricPart,
      });
    }

    return { isSectionHeader: false, isEmpty: false, segments };
  });
}

export const COMMON_KEYS = [
  'Do',
  'Do#',
  'Re',
  'Mib',
  'Mi',
  'Fa',
  'Fa#',
  'Sol',
  'La',
  'Sib',
  'Si',
  'Dom',
  'Rem',
  'Mim',
  'Fam',
  'Solm',
  'Lam',
  'Sim',
];
